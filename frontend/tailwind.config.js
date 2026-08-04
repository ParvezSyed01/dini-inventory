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
      }
    }
  },
  plugins: []
};