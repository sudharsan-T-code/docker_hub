/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        docker: {
          blue: "#1d63ed",
          darkBlue: "#091e42",
          bodyDark: "#020617",
          cardDark: "#0f172a",
          borderDark: "#1e293b",
          lightBlue: "#e0f2fe",
          gray: "#f8fafc",
        },
      },
    },
  },
  plugins: [],
};
