/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        upn: {
          50: '#eef6ff',
          100: '#d9ebff',
          500: '#2b7fff', // Azul brillante referencia
          600: '#0051ff', // Azul fuerte
          700: '#004aad', // Azul institucional aproximado UPN
          800: '#003d8f',
          900: '#1e3a8a',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
