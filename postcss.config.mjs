/** @type {import('postcss-load-config').Config} */
const config = {
  // Use the new PostCSS adapter package for Tailwind CSS
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
