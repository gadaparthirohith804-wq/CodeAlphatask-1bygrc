/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable class-based dark mode for premium look
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}',
    './src/**/*.css',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Custom background color used throughout the app
        background: 'hsl(210, 20%, 10%)', // dark bluish background
        // Additional palette for premium UI
        primary: 'hsl(340, 80%, 55%)', // vibrant pink/red
        secondary: 'hsl(190, 70%, 45%)', // teal
        accent: 'hsl(45, 90%, 55%)', // gold
        surface: 'hsl(210, 20%, 12%)', // slightly lighter than background
      },
      // Example of glassmorphism backdrop blur utility
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
  safelist: [{ pattern: /bg-background/ }],
};
