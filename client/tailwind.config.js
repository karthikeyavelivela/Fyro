/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#FF6B2B',
        'accent-dark': '#C94A10',
        'accent-light': '#FFF0E9',
        teal: '#0D9488',
        'teal-light': '#CCFBF1',
        bg: '#F2EFE9',
        surface: '#EAE6DF',
        'surface-raised': '#E3DED6',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        sm: '10px',
        md: '16px',
        lg: '24px',
      }
    }
  },
  plugins: []
}
