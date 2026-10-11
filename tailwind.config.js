/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f1f7f2",
          100: "#dcecdf",
          200: "#b9d8c0",
          300: "#8dbd99",
          400: "#5f9c72",
          500: "#3f7f55",
          600: "#2d6543",
          700: "#245137",
          800: "#1f5136",
          900: "#173d2a",
          950: "#0b2015",
        },
        cream: {
          50: "#fdfbf5",
          100: "#f6f1e4",
          200: "#efe6d2",
          300: "#e4d6b8",
          400: "#d6c197",
        },
        bark: {
          400: "#b08968",
          500: "#8a6a4f",
          600: "#6b5138",
          700: "#503c2a",
        },
        sun: "#e9b44c",
        clay: "#c06b3e",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "fall": {
          "0%": { transform: "translateY(-10%) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(540deg)", opacity: "0.9" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "pop-in": "pop-in 0.25s ease-out both",
        float: "float 3s ease-in-out infinite",
        fall: "fall linear",
      },
    },
  },
  plugins: [],
};
