/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta institucional (azul UPA del diagrama ER)
        sicad: {
          900: '#1e3a5f',
          800: '#244a73',
          700: '#2c5282',
          100: '#eaf1f8',
        },
      },
    },
  },
  plugins: [],
};
