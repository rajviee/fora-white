/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",    // root App.js
    "./src/**/*.{js,jsx,ts,tsx}", // 👈 scan all files in src/
    // "./components/**/*.{js,jsx,ts,tsx}", // if you keep some components outside src
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
