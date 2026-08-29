/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B2239',        // Dark Navy
        'dark-navy': '#1A3A52',    // Lighter navy (gradients)
        secondary: '#F5AD00',      // Gold
        accent: '#8F0F3F',         // Maroon/Burgundy
        'cream': '#FCFAF7',        // Cream/Off-white
        white: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}