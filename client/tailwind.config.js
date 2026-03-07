/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',
        accent: '#f97316',
      },
    },
  },
  plugins: [],
};
