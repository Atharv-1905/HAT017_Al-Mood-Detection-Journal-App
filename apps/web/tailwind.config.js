/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f0fdf4', // very light calm green
        surface: '#ffffff',
        primary: '#4ade80', // soft green
        secondary: '#60a5fa', // soft blue
        text: '#1f2937',
        'text-light': '#6b7280',
        danger: '#f87171',
        warning: '#fbbf24',
      },
      animation: {
        'breathe': 'breathe 14s infinite ease-in-out',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '28%': { transform: 'scale(1.5)', opacity: '1' },
          '57%': { transform: 'scale(1.5)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
