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
        "bg-primary":   "#0F0F14",
        "bg-card":      "#1A1A24",
        "bg-elevated":  "#22223A",
        "accent":       "#7C6AF5",
        "accent-light": "#9B8FF7",
        "accent-teal":  "#4ECDC4",
        "success":      "#22C55E",
        "warning":      "#F59E0B",
        "danger":       "#EF4444",
        "text-primary": "#F1F1F5",
        "text-muted":   "#9090A8",
        "border":       "#2A2A3E",
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
