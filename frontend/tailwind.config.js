/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1C2333',
          50: '#F4F5F7',
          100: '#E4E6EB',
          300: '#9AA1B2',
          500: '#4E5668',
          700: '#2A3143',
          900: '#1C2333'
        },
        canvas: '#F7F6F2',
        brass: {
          DEFAULT: '#B8862E',
          50: '#FBF4E6',
          100: '#F3E1B8'
        },
        thread: {
          green: '#2F7A5C',
          greenBg: '#E8F3EE',
          amber: '#B4780F',
          amberBg: '#FBF0DC',
          red: '#B4442E',
          redBg: '#FBE9E5'
        }
      },
      fontFamily: {
        display: ['"Manrope"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif']
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        card: '0 1px 2px rgba(41, 30, 15, 0.04), 0 10px 30px -18px rgba(41, 30, 15, 0.28)',
        'card-hover': '0 1px 2px rgba(41, 30, 15, 0.05), 0 18px 40px -20px rgba(41, 30, 15, 0.35)',
        header: '0 8px 30px -18px rgba(41, 30, 15, 0.65)',
        pop: '0 30px 70px -25px rgba(28, 20, 8, 0.55)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(14px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'rise-in': 'rise-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both'
      },
      backgroundImage: {
        'brass-sheen': 'linear-gradient(135deg, #451a03 0%, #78350f 55%, #92400e 100%)',
        'canvas-grain':
          'radial-gradient(1200px 500px at 12% -8%, rgba(180, 134, 46, 0.10), transparent 60%), radial-gradient(900px 450px at 92% 0%, rgba(69, 26, 3, 0.07), transparent 55%)'
      }
    }
  },
  plugins: []
};