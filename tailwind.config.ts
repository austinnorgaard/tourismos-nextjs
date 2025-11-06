import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Core CSS variable mappings used across the app:
           Map Tailwind color names to CSS variables defined in `app/globals.css`.
           This lets classes like `border-border`, `bg-card`, `text-primary`,
           and `ring-ring/50` resolve to the runtime CSS variables. */
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--color-primary)",
        "primary-foreground": "var(--primary-foreground)",
        card: "var(--color-card)",
        "card-foreground": "var(--card-foreground)",
        muted: "var(--color-muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        sidebar: "var(--sidebar)",
        "sidebar-foreground": "var(--sidebar-foreground)",
        "sidebar-accent": "var(--sidebar-accent)",
        "sidebar-accent-foreground": "var(--sidebar-accent-foreground)",
        "sidebar-border": "var(--sidebar-border)",
        "sidebar-ring": "var(--sidebar-ring)",
        /* Chart palette tokens (optional) */
        "chart-1": "var(--chart-1)",
        "chart-2": "var(--chart-2)",
        "chart-3": "var(--chart-3)",
        "chart-4": "var(--chart-4)",
        "chart-5": "var(--chart-5)",
      },
    },
  },
  plugins: [],
};
export default config;
