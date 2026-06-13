/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#040714',     // Deep navy for Gemini dark mode
        surface: 'rgba(255, 255, 255, 0.03)',
        surfaceHighlight: 'rgba(255, 255, 255, 0.08)',
        border: 'rgba(255, 255, 255, 0.1)',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        primary: '#4285f4',        // Google Blue
        gemini: {
          blue: '#4285f4',
          purple: '#9b72cb',
          pink: '#d96570',
          cyan: '#12b5cb',
        }
      },
      animation: {
        'shimmer': 'shimmer 3s infinite linear',
        'aurora': 'aurora 20s linear infinite',
        'blob': 'blob 10s infinite',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '50% 50%, 50% 50%' },
          '50%': { backgroundPosition: '100% 50%, 0% 50%' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
