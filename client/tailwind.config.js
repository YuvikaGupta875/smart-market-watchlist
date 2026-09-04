/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        finance: {
          bg: "#090d16",
          card: "#101626",
          hover: "#172036",
          border: "#1e293b",
          muted: "#94a3b8",
          up: "#10b981",
          down: "#ef4444",
          accent: "#3b82f6",
          warning: "#f59e0b",
          critical: "#ec4899",
          purple: "#8b5cf6"
        }
      }
    }
  },
  plugins: []
};
