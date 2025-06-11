/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 'sans' will now default to Poppins, then fall back to system sans-serif fonts
        sans: ['Poppins', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}
