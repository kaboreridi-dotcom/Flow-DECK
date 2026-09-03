// Flow DECK — views dictionary (FR / EN) — filled by views agent
// Namespaces: views (filter bar notes, smart view headers, counts)
import type { Dictionary } from "./translations";

export const viewMessages: Record<"fr" | "en", Dictionary> = {
  fr: {
    "views.count": "{count} tâche(s)",
    "views.noLabels": "Aucune étiquette à filtrer sur ce tableau.",

    "views.smart.done.title": "Terminées",
    "views.smart.done.subtitle": "Vos tâches accomplies, les plus récentes d’abord.",
    "views.smart.done.empty":
      "Aucune tâche terminée pour l’instant — cochez une tâche pour la retrouver ici.",

    "views.smart.overdue.title": "En retard",
    "views.smart.overdue.subtitle": "À traiter en priorité, échéance la plus ancienne d’abord.",
    "views.smart.overdue.empty": "Rien en retard — vous êtes parfaitement à jour.",

    "views.smart.soon.title": "Échéances proches",
    "views.smart.soon.subtitle": "À faire aujourd’hui ou dans les trois prochains jours.",
    "views.smart.soon.empty": "Aucune échéance proche — respirez.",
  },

  en: {
    "views.count": "{count} task(s)",
    "views.noLabels": "No labels to filter on this board.",

    "views.smart.done.title": "Completed",
    "views.smart.done.subtitle": "Your finished tasks, most recent first.",
    "views.smart.done.empty":
      "No completed tasks yet — check one off and it will show up here.",

    "views.smart.overdue.title": "Overdue",
    "views.smart.overdue.subtitle": "Needs attention first, oldest due date on top.",
    "views.smart.overdue.empty": "Nothing overdue — you are right on track.",

    "views.smart.soon.title": "Due soon",
    "views.smart.soon.subtitle": "Due today or within the next three days.",
    "views.smart.soon.empty": "Nothing due soon — take a breath.",
  },
};
