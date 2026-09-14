/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink:   { DEFAULT: "#1E1E1E", dark: "#171717", deep: "#141414", black: "#101010" },
        gold:  { DEFAULT: "#F9C70F", light: "#FFDE59", dark: "#E0A800" },
        paper: "#F0F3F4"
      },
      fontFamily: {
        display: ["Montserrat", "system-ui", "sans-serif"],
        sans:    ["Roboto", "system-ui", "sans-serif"],
        mono:    ['"Roboto Mono"', "ui-monospace", "monospace"]
      },
      borderRadius: { DEFAULT: "8px", pill: "10px" },
      maxWidth: { shell: "1280px" },
      backgroundImage: {
        goldgrad: "linear-gradient(118deg,#F9C70F 0%,#FFDE59 46%,#E0A800 100%)",
        stage: "radial-gradient(120% 95% at 76% 18%,#2b2b2b 0%,#1E1E1E 45%,#121212 100%)"
      }
    }
  },
  plugins: []
};
