/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ivory: "#FDFBF7",
          cream: "#F7F3EC",
          sand: "#EFE8DC",
          taupe: "#8C827A",
          charcoal: "#23201E",
          gold: "#C5A880",
          goldLight: "#E5D4BE",
          goldDark: "#9F8259",
        }
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      }
    },
  },
  plugins: [],
}
