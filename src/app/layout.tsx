import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = "https://flowdeck.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Flow DECK — Gestion de tâches Kanban | Kanban task manager",
    template: "%s — Flow DECK",
  },
  description:
    "Flow DECK : organisateur de tâches Kanban local, rapide et privé. Créez des tableaux, glissez-déposez vos tâches, suivez échéances, priorités et statistiques — sans compte, sans serveur, directement dans votre navigateur. | Flow DECK: a local, fast and private Kanban task manager. Boards, drag & drop, due dates, priorities and stats — no account, no server, right in your browser.",
  keywords: [
    "Flow DECK",
    "Kanban",
    "gestion de tâches",
    "tableau Kanban",
    "task management",
    "kanban board",
    "productivité",
    "to-do list",
    "organisation",
    "productivity",
  ],
  applicationName: "Flow DECK",
  authors: [{ name: "MOHAMED R B KABORE" }],
  creator: "MOHAMED R B KABORE",
  publisher: "MOHAMED R B KABORE",
  icons: {
    icon: "/flowdeck-logo.png",
    apple: "/flowdeck-logo.png",
  },
  manifest: undefined,
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "Flow DECK",
    title: "Flow DECK — Gestion de tâches Kanban locale et privée",
    description:
      "Tableaux Kanban, glisser-déposer, échéances, priorités, statistiques. Un espace de travail complet et privé, directement dans votre navigateur, sans compte ni serveur.",
    images: [
      {
        url: "/flowdeck-logo.png",
        width: 1200,
        height: 1200,
        alt: "Flow DECK",
      },
    ],
    locale: "fr_FR",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flow DECK — Gestion de tâches Kanban",
    description:
      "Tableaux Kanban locaux, rapides et privés — sans compte, sans serveur. Local, fast and private Kanban boards — no account, no server.",
    images: ["/flowdeck-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: APP_URL,
  },
  other: {
    "google": "notranslate",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0c10" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Flow DECK",
  alternateName: "Flow Deck — Kanban task manager",
  url: APP_URL,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  description:
    "Organisateur de tâches Kanban local et privé : tableaux personnalisables, glisser-déposer, échéances, priorités, étiquettes, sous-tâches, statistiques, archives et corbeille. Fonctionne entièrement dans le navigateur, sans compte utilisateur. Local and private Kanban task organizer: customizable boards, drag & drop, due dates, priorities, labels, subtasks, statistics, archives and trash. Runs entirely in the browser, no account needed.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  featureList: [
    "Tableaux Kanban personnalisables",
    "Glisser-déposer des tâches et colonnes",
    "Échéances et rappels de retard",
    "Priorités et étiquettes",
    "Sous-tâches et progression",
    "Statistiques locales",
    "Fonctionnement hors connexion",
  ],
  inLanguage: ["fr", "en"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
