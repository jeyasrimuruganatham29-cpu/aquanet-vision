/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefaf9',
          100: '#d3f2ef',
          500: '#1b9ca1',
          600: '#147f84',
          700: '#12676c',
          800: '#145358',
        },
        ocean: {
          950: '#030712',
          900: '#060E1A',
          850: '#0A1628',
          800: '#0A1F44',
          750: '#0C2B56',
          700: '#005F73',
          600: '#0077B6',
          500: '#0096C7',
          400: '#00B4D8',
          300: '#48CAE4',
          200: '#90E0EF',
          100: '#ADE8F4',
          50: '#CAF0F8',
        },
        cyan: {
          neon: '#31C6C3',
          glow: '#69C7D1',
        },
        status: {
          safe: '#10B981',
          moderate: '#F59E0B',
          unsafe: '#EF4444',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glass-sm': '0 4px 16px -2px rgba(15, 35, 48, 0.08)',
        'glass-md': '0 8px 28px rgba(15, 35, 48, 0.1)',
        'glass-lg': '0 16px 40px rgba(7, 17, 31, 0.16)',
        'neon-glow': '0 0 12px -4px rgba(49, 198, 195, 0.28)',
        'neon-glow-lg': '0 0 20px -4px rgba(49, 198, 195, 0.36)',
        'safe-glow': '0 0 12px -4px rgba(16, 185, 129, 0.24)',
        'warn-glow': '0 0 12px -4px rgba(245, 158, 11, 0.24)',
        'danger-glow': '0 0 12px -4px rgba(239, 68, 68, 0.24)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'ocean-gradient': 'linear-gradient(135deg, #0A1F44 0%, #0077B6 55%, #1B9CA1 100%)',
        'aqua-glow': 'linear-gradient(135deg, #31C6C3 0%, #147F84 100%)',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'glass-gradient-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(240, 249, 255, 0.6) 100%)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave-flow': 'waveFlow 12s linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        waveFlow: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
