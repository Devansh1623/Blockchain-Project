/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark minimalistic palette
        surface: {
          DEFAULT: '#171717',
          2: '#222222',
          3: '#2a2a2a',
        },
        border: {
          DEFAULT: '#262626',
          2: '#333333',
          focus: '#404040',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          muted: 'rgba(59,130,246,0.1)',
        },
        risk: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#22c55e',
          'critical-bg': 'rgba(239,68,68,0.08)',
          'high-bg': 'rgba(249,115,22,0.08)',
          'medium-bg': 'rgba(234,179,8,0.08)',
          'low-bg': 'rgba(34,197,94,0.08)',
        },
        text: {
          DEFAULT: '#fafafa',
          2: '#a1a1aa',
          3: '#52525b',
          4: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '8px',
        xl: '12px',
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 150ms ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
};
