import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        shopee: {
          DEFAULT: "#EE4D2D",
          50:  "#FFF0ED",
          100: "#FFD9D0",
          200: "#FFB3A5",
          300: "#FF8C79",
          400: "#F56B50",
          500: "#EE4D2D",
          600: "#CC3A1E",
          700: "#A82C12",
          800: "#832108",
          900: "#5C1602",
        },
      },
    },
  },
  plugins: [],
};
export default config;
