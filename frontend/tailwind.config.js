/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5', // indigo-600
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        secondary: {
          DEFAULT: '#9333ea', // purple-600
          50: '#faf5ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        accent: {
          DEFAULT: '#22d3ee', // cyan-400
          400: '#22d3ee',
          500: '#06b6d4',
        },
        dark: {
          DEFAULT: '#0f172a', // slate-900
          900: '#0f172a',
          950: '#020617',
        },
        surface: {
          DEFAULT: '#1e293b', // slate-800
          800: '#1e293b',
          700: '#334155',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
