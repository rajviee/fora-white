/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1360C6',
          50: 'rgba(19, 96, 198, 0.05)',
          75: 'rgba(19, 96, 198, 0.75)',
          half: 'rgba(19, 96, 198, 0.50)',
          light: '#EBF2FC',
          dark: '#0F4C9E',
        },
        secondary: {
          DEFAULT: '#103362',
        },
      },
    },
  },
  plugins: [],
}
