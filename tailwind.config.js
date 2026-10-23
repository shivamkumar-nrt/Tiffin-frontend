/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffcf0',
          100: '#fff6d1',
          200: '#ffeb99',
          300: '#fedc5e',
          400: '#f8c630',
          500: '#e9ae12',
          600: '#c98a06',
          700: '#a26a07',
          800: '#80520b',
          900: '#66420e',
        },
        cream: '#fffaf0',
        brown: {
          900: '#3a2a12',
        },
      }
    },
  },
  plugins: [],
}
