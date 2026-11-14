/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui compatible colors using CSS variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#1DB954",
          foreground: "#011a0a",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Cyberpunk Custom Colors
        // CoC design system: one accent (electric spring green) + ink/grey scale
        matrix: {
          50: "#A6EDBF",
          100: "#4FD27D",
          200: "#1DB954",
          300: "#169040",
          400: "#1DB954",
          500: "#0F6B2E",
        },
        cyber: {
          cyan: "#1DB954",
          purple: "#9AA09C",
          pink: "#9AA09C",
        },
        zinc: {
          50: "#F5F7F5",
          100: "#EEEFEA",
          200: "#D9DBD7",
          300: "#B9BDBA",
          400: "#9AA09C",
          500: "#737975",
          600: "#4A504D",
          700: "#2E3330",
          800: "#1D211F",
          900: "#151817",
          950: "#0E100F",
        },
      },

      borderRadius: {
        lg: "20px",
        md: "14px",
        sm: "10px",
      },

      fontFamily: {
        sans: ["Switzer", "system-ui", "sans-serif"],
        display: ["Cabinet Grotesk", "Switzer", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },

      keyframes: {
        // shadcn/ui animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        // Cyberpunk animations
        glow: {
          "0%, 100%": {
            boxShadow: "0 0 5px rgb(34 197 94), 0 0 10px rgb(34 197 94)"
          },
          "50%": {
            boxShadow: "0 0 20px rgb(34 197 94), 0 0 30px rgb(34 197 94), 0 0 40px rgb(34 197 94)"
          },
        },

        "glow-pulse": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 30px rgba(34, 197, 94, 0.6), 0 0 50px rgba(34, 197, 94, 0.4)",
          },
        },

        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },

        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },

        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },

        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },

        flicker: {
          "0%, 100%": { opacity: "1" },
          "41%": { opacity: "1" },
          "42%": { opacity: "0.6" },
          "43%": { opacity: "1" },
          "45%": { opacity: "0.8" },
          "46%": { opacity: "1" },
        },

        "text-flicker": {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": {
            textShadow: "0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(34, 197, 94, 0.3)",
            opacity: "1",
          },
          "20%, 24%, 55%": {
            textShadow: "none",
            opacity: "0.7",
          },
        },

        glitch: {
          "0%": {
            transform: "translate(0)",
          },
          "20%": {
            transform: "translate(-2px, 2px)",
          },
          "40%": {
            transform: "translate(-2px, -2px)",
          },
          "60%": {
            transform: "translate(2px, 2px)",
          },
          "80%": {
            transform: "translate(2px, -2px)",
          },
          "100%": {
            transform: "translate(0)",
          },
        },

        "slide-up": {
          "0%": {
            transform: "translateY(20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },

        "slide-down": {
          "0%": {
            transform: "translateY(-20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },

        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },

        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },

        "border-beam": {
          "0%": {
            "background-position": "0% 50%",
          },
          "50%": {
            "background-position": "100% 50%",
          },
          "100%": {
            "background-position": "0% 50%",
          },
        },

        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
      },

      animation: {
        // shadcn/ui
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",

        // Cyberpunk animations
        glow: "glow 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        flicker: "flicker 3s linear infinite",
        "text-flicker": "text-flicker 3s linear infinite",
        glitch: "glitch 1s linear infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-down": "slide-down 0.5s ease-out",
        "fade-out": "fade-out 0.5s ease-out",
        "border-beam": "border-beam 3s linear infinite",
        // Gradient Text Animation
        'gradient-x': 'gradient-x 3s ease infinite',
        // Fade In Animation
        'fade-in': 'fade-in 0.5s ease-out forwards',
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px)",
      },

      backdropBlur: {
        xs: "2px",
      },

      boxShadow: {
        "glow-sm": "none",
        "glow-md": "none",
        "glow-lg": "none",
        "glow-cyan": "none",
        "glow-purple": "none",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
