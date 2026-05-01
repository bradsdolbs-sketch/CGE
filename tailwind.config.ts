import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#1a1a1a',
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#a8a8a8',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#2e2e2e',
          800: '#1a1a1a',
          900: '#0d0d0d',
        },
        cream: {
          DEFAULT: '#F0EBE0',
          50: '#faf8f4',
          100: '#F0EBE0',
          200: '#e2d8c8',
          300: '#d0c0a8',
          400: '#baa588',
        },
        terracotta: {
          DEFAULT: '#1A3D2B',
          50: '#F0EBE0',
          100: '#d4e6da',
          200: '#a8ccb5',
          300: '#6faa87',
          400: '#3d7a58',
          500: '#1A3D2B',
          600: '#122B1E',
          700: '#0d1f16',
          800: '#08140e',
          900: '#040a07',
        },
        slate: {
          DEFAULT: '#4a6fa5',
          50: '#eef2f8',
          100: '#d9e3f0',
          200: '#b3c7e1',
          300: '#8aadd1',
          400: '#6991be',
          500: '#4a6fa5',
          600: '#3b5a88',
          700: '#2e466b',
          800: '#22334e',
          900: '#162133',
        },
        taupe: {
          DEFAULT: '#8a7968',
          light: '#c9bfb0',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)', 'Syne', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        '800': '800',
      },
      fontSize: {
        '11': '11px',
        '13': '13px',
      },
      letterSpacing: {
        'editorial': '0.15em',
        'wide-plus': '0.08em',
      },
      lineHeight: {
        '1': '1',
        'tight-plus': '1.1',
      },
      maxWidth: {
        '65ch': '65ch',
        '480': '480px',
      },
      borderRadius: {
        'editorial': '2px',
        'sm-editorial': '3px',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#1a1a1a',
            maxWidth: 'none',
            fontFamily: 'var(--font-dm-sans)',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
