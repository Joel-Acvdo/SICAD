/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta institucional SICAD (de la guía de estilo hecha en Pencil)
        marino: { DEFAULT: '#14274E', dark: '#0D1B38', light: '#24407A' }, // Azul marino
        azulmedio: { DEFAULT: '#3F72BF', light: '#5B8FD6' },               // Azul medio
        platino: { DEFAULT: '#C8CDD3', light: '#ECEEF1' },                 // Platino
        'gris-fondo': '#F1F5F9',                                           // Fondo de pantallas
        verde: '#16A34A',                                                  // Permitido / activo
        rojo: '#DC2626',                                                   // Denegado / inactivo
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { 'fade-in': 'fade-in 0.3s ease-out' },
    },
  },
  plugins: [],
};
