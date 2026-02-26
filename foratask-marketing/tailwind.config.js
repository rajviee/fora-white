/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1360C6',
          50: 'rgba(19, 96, 198, 0.05)',
          75: 'rgba(19, 96, 198, 0.75)',
          light: '#EBF2FC',
          dark: '#0F4C9E',
          100: '#D9EAFC',
          200: '#B3D5F9',
          300: '#6BABF0',
          400: '#3D8CE5',
          500: '#1360C6',
          600: '#0F4C9E',
          700: '#0C3B7A',
          800: '#092D5E',
          900: '#061D3F',
        },
        secondary: {
          DEFAULT: '#103362',
        },
        accent: {
          DEFAULT: '#16b571',
          50: '#edfcf4',
          100: '#d3f8e3',
          200: '#aaf0cc',
          300: '#73e2ae',
          400: '#3ace8c',
          500: '#16b571',
          600: '#0a925b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
