import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1b2a49',
        brand: {
          DEFAULT: '#3158db',
          dark: '#2449c8',
          soft: '#e7efff',
        },
      },
      boxShadow: {
        soft: '0 8px 24px rgba(67, 95, 158, 0.07)',
        card: '0 4px 14px rgba(37, 67, 123, 0.04)',
        lift: '0 9px 22px rgba(37, 67, 123, 0.09)',
      },
    },
  },
  plugins: [],
};

export default config;
