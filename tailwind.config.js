/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    colors: {
      'green': "#1DB954",
      'dark-green': "#168c40"
    },
    fontFamily: {
      body: ['proxima-nova', 'sans-serif'],
      titles: ['sofia-pro', 'sans-serif'],
    }
  },
  plugins: [],
}
