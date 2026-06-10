export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A3D6B',
          light: '#1565A8',
          dark: '#061E35',
          pale: '#E8F0F9',
        },
        accent: {
          DEFAULT: '#C8980A',
          light: '#FFF8E1',
          dark: '#8C6B00',
        },
        neutral: {
          50: '#F7F9FC',
          100: '#EEF2F8',
          200: '#DDE4EE',
          300: '#C0CCD9',
          400: '#8EA3B8',
          500: '#5B7A92',
          600: '#3F5C6E',
          700: '#2B3F50',
          800: '#182532',
          900: '#0A1318',
        },
        status: {
          active: '#16A34A',
          suspended: '#D97706',
          expired: '#6B7280',
          revoked: '#DC2626',
          pending: '#0891B2',
          valid: '#16A34A',
          invalid: '#DC2626',
        },
      },
    },
  },
  plugins: [],
}
