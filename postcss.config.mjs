// Not TypeScript: Next.js reads postcss.config.{js,mjs,cjs} and .postcssrc.json only.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
