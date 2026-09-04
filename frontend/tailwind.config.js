/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Agricultural green primary
        mandi: {
          50: '#f0f7ed',
          100: '#dbedcf',
          200: '#bbdaa6',
          300: '#92c074',
          400: '#6da44b',
          500: '#4f8a31',
          600: '#3a6e24',
          700: '#2d561e',
          800: '#24451d',
          900: '#1d391b',
          950: '#0f200c',
        },
        // Warm orange accent (Vidarbha agricultural identity)
        harvest: {
          50: '#fdf6ed',
          100: '#f9e8c9',
          200: '#f3cd8e',
          300: '#ecab53',
          400: '#e68d2c',
          500: '#d9711a',
          600: '#bd5513',
          700: '#9c3f14',
          800: '#7d3315',
          900: '#662b14',
          950: '#381407',
        },
        // Neutral off-white backgrounds
        field: {
          50: '#fbfaf7',
          100: '#f5f3ec',
          200: '#e9e4d6',
          300: '#d6cdb6',
          400: '#b8aa8a',
          500: '#9d8c6b',
          600: '#827356',
          700: '#6a5d47',
          800: '#584d3c',
          900: '#4a4134',
          950: '#2a241b',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(29, 57, 27, 0.06), 0 1px 2px -1px rgba(29, 57, 27, 0.06)',
        'card-hover': '0 8px 24px -6px rgba(29, 57, 27, 0.12), 0 4px 8px -4px rgba(29, 57, 27, 0.08)',
        soft: '0 2px 8px -2px rgba(29, 57, 27, 0.08)',
      },
      backgroundImage: {
        'mandi-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232d561e' fill-opacity='0.04'%3E%3Cpath d='M30 10c-4 8-2 14 4 18 6-4 8-10 4-18-2 4-6 4-8 0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
