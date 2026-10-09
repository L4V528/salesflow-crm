/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#bed0ff',
          300: '#91b0ff',
          400: '#5f87fb',
          500: '#3b62f6',
          600: '#2544eb',
          700: '#1d34d8',
          800: '#1e2eaf',
          900: '#1e2d8a',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d9dde5',
          300: '#b9c0cd',
          400: '#8d97a8',
          500: '#6b7688',
          600: '#525c6e',
          700: '#414a59',
          800: '#2f3540',
          900: '#1c2027',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Microsoft YaHei"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        pop: '0 12px 32px rgba(16,24,40,.12)',
      },
    },
  },
  plugins: [],
};
