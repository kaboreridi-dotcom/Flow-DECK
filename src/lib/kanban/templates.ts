// Flow DECK — board templates (pure data, resolved through i18n at creation time)
import type { Priority } from "./types";

export interface TemplateTaskSpec {
  titleKey: string;
  descKey?: string;
  col: number; // column index
  priority?: Priority;
}

export interface TemplateSpec {
  id: string;
  columns: string[]; // i18n keys
  labels?: { key: string; color: string }[];
  tasks: TemplateTaskSpec[];
}

export interface TemplateBoard {
  id: string;
  name: string;
  description: string;
  columns: string[];
  labels: { name: string; color: string }[];
  tasks: { title: string; description: string; columnIndex: number; priority: Priority }[];
}

export const TEMPLATES: TemplateSpec[] = [
  {
    id: "project",
    columns: ["template.project.col1", "template.project.col2", "template.project.col3", "template.project.col4"],
    labels: [
      { key: "template.project.label1", color: "#2E6BFF" },
      { key: "template.project.label2", color: "#2BD98A" },
      { key: "template.project.label3", color: "#F59E0B" },
    ],
    tasks: [
      { titleKey: "template.project.task1", col: 0, priority: "high" },
      { titleKey: "template.project.task2", col: 1, priority: "normal" },
      { titleKey: "template.project.task3", col: 3, priority: "low" },
    ],
  },
  {
    id: "personal",
    columns: ["template.personal.col1", "template.personal.col2", "template.personal.col3"],
    tasks: [
      { titleKey: "template.personal.task1", col: 0, priority: "normal" },
      { titleKey: "template.personal.task2", col: 0, priority: "low" },
    ],
  },
  {
    id: "weekly",
    columns: ["template.weekly.col1", "template.weekly.col2", "template.weekly.col3", "template.weekly.col4", "template.weekly.col5"],
    tasks: [{ titleKey: "template.weekly.task1", col: 0, priority: "normal" }],
  },
  {
    id: "editorial",
    columns: ["template.editorial.col1", "template.editorial.col2", "template.editorial.col3", "template.editorial.col4"],
    labels: [
      { key: "template.editorial.label1", color: "#8B5CF6" },
      { key: "template.editorial.label2", color: "#2BD98A" },
    ],
    tasks: [
      { titleKey: "template.editorial.task1", col: 1, priority: "normal" },
      { titleKey: "template.editorial.task2", col: 0, priority: "low" },
    ],
  },
  {
    id: "ideas",
    columns: ["template.ideas.col1", "template.ideas.col2", "template.ideas.col3"],
    tasks: [{ titleKey: "template.ideas.task1", col: 0, priority: "low" }],
  },
  {
    id: "dev",
    columns: ["template.dev.col1", "template.dev.col2", "template.dev.col3", "template.dev.col4"],
    labels: [
      { key: "template.dev.label1", color: "#EF4444" },
      { key: "template.dev.label2", color: "#2E6BFF" },
      { key: "template.dev.label3", color: "#2BD98A" },
    ],
    tasks: [
      { titleKey: "template.dev.task1", col: 0, priority: "high" },
      { titleKey: "template.dev.task2", col: 1, priority: "normal" },
    ],
  },
  {
    id: "shopping",
    columns: ["template.shopping.col1", "template.shopping.col2", "template.shopping.col3"],
    tasks: [{ titleKey: "template.shopping.task1", col: 0, priority: "normal" }],
  },
  {
    id: "goals",
    columns: ["template.goals.col1", "template.goals.col2", "template.goals.col3", "template.goals.col4"],
    tasks: [{ titleKey: "template.goals.task1", col: 0, priority: "high" }],
  },
];

export function getTemplate(id: string): TemplateSpec | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export type Translator = (key: string) => string;

export function buildTemplateBoard(id: string, t: Translator): TemplateBoard | null {
  const spec = getTemplate(id);
  if (!spec) return null;
  return {
    id: spec.id,
    name: t(`template.${spec.id}.name`),
    description: t(`template.${spec.id}.desc`),
    columns: spec.columns.map((k) => t(k)),
    labels: (spec.labels ?? []).map((l) => ({ name: t(l.key), color: l.color })),
    tasks: spec.tasks.map((task) => ({
      title: t(task.titleKey),
      description: task.descKey ? t(task.descKey) : "",
      columnIndex: task.col,
      priority: task.priority ?? "normal",
    })),
  };
}

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);
