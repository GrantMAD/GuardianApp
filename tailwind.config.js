/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // These resolve from CSS variables — updated at runtime by toggling .dark on <html>
        "bg-primary":   "var(--color-bg-primary)",
        "bg-card":      "var(--color-bg-card)",
        "bg-elevated":  "var(--color-bg-elevated)",
        "text-primary": "var(--color-text-primary)",
        "text-muted":   "var(--color-text-muted)",
        "border":       "var(--color-border)",
        // Accent & semantic colors are identical in both themes
        "accent":       "#7C6AF5",
        "accent-light": "#9B8FF7",
        "accent-teal":  "#4ECDC4",
        "success":      "#22C55E",
        "warning":      "#F59E0B",
        "danger":       "#EF4444",
      },
      fontFamily: {
        sans:     ["Inter_400Regular"],
        medium:   ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold:     ["Inter_700Bold"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
