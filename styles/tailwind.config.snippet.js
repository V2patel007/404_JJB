/**
 * Merge this into your existing tailwind.config.js `theme.extend`.
 * Fonts assume you've loaded "Space Grotesk" (display) and "Inter" (body),
 * e.g. via next/font, @fontsource, or a <link> to Google Fonts.
 */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        brickGlow: {
          "0%": { opacity: "0" },
          "30%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        brickGlow: "brickGlow 300ms ease-out",
      },
    },
  },
};
