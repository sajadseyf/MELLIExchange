/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fbf7ec',
          100: '#f5ead0',
          200: '#ecd49d',
          300: '#e0b96a',
          400: '#d4a04a',
          500: '#b8860b',
          600: '#996f08',
          700: '#7a5707',
          800: '#5c4106',
          900: '#3d2b04',
        },
        ink: {
          50:  '#f5f5f4',
          100: '#e7e5e4',
          200: '#cfcbc8',
          300: '#a8a29e',
          400: '#78716c',
          500: '#57534e',
          600: '#44403c',
          700: '#2c2a27',
          800: '#1c1b19',
          900: '#0f0e0d',
        },
        cream: '#fbf7ec',
        burgundy: '#6b1f2a',
        navy: {
          50:  '#f1f4fa',
          100: '#dce3f0',
          200: '#b3bfe2',
          300: '#8093d2',
          400: '#5772c0',
          500: '#3b57ab',
          600: '#2c4490',
          700: '#213576',
          800: '#18285e',
          900: '#101e4b',
        },
        surface: {
          DEFAULT: '#ffffff',
          raised: '#f9fafb',
          sunken: '#f5f5f4',
        },
        dark: {
          DEFAULT: '#09090b',
          card: '#131316',
          raised: '#1a1a1f',
          border: '#27272a',
          muted: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(15, 14, 13, 0.08)',
        card: '0 2px 12px -2px rgba(15, 14, 13, 0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};
