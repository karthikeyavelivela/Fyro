/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-secondary': 'var(--bg-secondary)',
        surface: 'var(--surface)',
        'surface-dark': 'var(--surface-dark)',
        'surface-dark-2': 'var(--surface-dark-2)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'border-dark': 'var(--border-dark)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        'text-on-dark': 'var(--text-on-dark)',
        accent: 'var(--accent)',
        'accent-dark': 'var(--accent-dark)',
        'accent-hover': 'var(--accent-hover)',
        'accent-light': 'var(--accent-light)',
        teal: 'var(--teal)',
        'teal-light': 'var(--teal-light)',
        green: 'var(--green)',
        amber: 'var(--amber)',
        red: 'var(--red)',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        }
      }
    }
  },
  plugins: []
}
