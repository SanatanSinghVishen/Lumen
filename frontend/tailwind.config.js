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
        background: '#0a0a0a',
        surface: '#111111',
        surfaceHighlight: '#1a1a1a',
        border: '#222222',
        text: '#eaeaea',
        textMuted: '#888888',
        primary: '#4ade80', // Green for success/actions
      }
    },
  },
  plugins: [],
}
