/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neutrals
        trivexaWhite: '#FFFFFF',
        trivexaBlack: '#000000',

        trivexaGray100: '#E0EBF2',
        trivexaGray150: '#D9D9D9',
        trivexaGray200: '#D1D1D1',
        trivexaGray300: '#CDDCE5',
        trivexaGray400: '#929292',
        trivexaGray500: '#8D8D8D',
        trivexaGray600: '#787665',
        trivexaGray700: '#404040',
        trivexaGray800: '#2F3A3E',

        // Blues / desaturated blues
        trivexaBlue100: '#E0EBF2',
        trivexaBlue200: '#CDDCE5',
        trivexaBlue300: '#7D96A4',
        trivexaBlue400: '#56717D',
        trivexaBlue500: '#36545F',

        // Accent greens
        trivexaGreen400: '#7A968B',

        // Accent earth tones
        trivexaSand400: '#A09176',
        trivexaBrown400: '#7F7362',

        // Accent red
        trivexaRed400: '#BC3737',
      },
    },
  },
  plugins: [],
};

