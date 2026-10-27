/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#13233A',
        field: { DEFAULT: '#23893A', dark: '#1B6E2E', soft: '#E3F2E5' },
        turf: '#F3F6F1',
        line: '#D6DED4',
        muted: '#5A6878',
        gold: '#B98A10', silver: '#7C8A9A', bronze: '#A8622F',
        warn: { DEFAULT: '#B4541A', soft: '#FBE9DD' },
        danger: { DEFAULT: '#B42318', soft: '#FDECEA' },
      },
      fontFamily: {
        display: ['"Chakra Petch"', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans Thai"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
