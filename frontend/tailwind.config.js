/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blush: "#F9D9DF",
        "blush-dark": "#F2B8C4",
        orange: "#E8722C",
        green: "#4CAF50",
        navy: "#1A1A2E",
        primary: "#1A1A2E",
        surface: "#FFFFFF",
        neutral: "#666666",
        "neutral-light": "#999999",
        "bg-light": "#FFFFFF",
        "border-color": "#E0E0E0",
        "border-light": "#F0F0F0",
        error: "#CC0000",
        success: "#4CAF50",
        gold: "#E8722C",
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        inter: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
        poppins: ["Poppins", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
        "xl": "16px",
        full: "999px",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        lift: "0 4px 12px rgba(0,0,0,0.12)",
        card: "0 2px 4px rgba(0,0,0,0.06)",
        sm: "0 1px 2px rgba(0,0,0,0.05)",
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
      },
      maxWidth: {
        container: "1200px",
      },
    },
  },
  plugins: [],
}
