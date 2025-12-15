/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "sea-night": "#0b1220",
        "sea-panel": "#101a2c",
        "sea-accent": "#42a5f5",
        "sea-hit": "#f97316",
        "sea-sunk": "#ef4444",
        "sea-miss": "#94a3b8"
      }
    }
  },
  plugins: []
};
