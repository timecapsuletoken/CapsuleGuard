// src/styles/theme.ts
import { createTheme } from "@mui/material/styles";

export const Theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: "#F9F9FE",
          paper: "#EEEEF9",
        },
        primary: {
          main: "#9e03f2",
          light: "#c773f5",
          dark: "#5f0191",
          contrastText: "#ffffff",
        },
        secondary: {
          main: "#595959",
          light: "rgb(143, 143, 143)",
          dark: "#333333",
          contrastText: "#ffffff",
        },
        text: {
          primary: "#333",
          secondary: "#555555",
        },
      },
    },
    dark: {
      palette: {
        background: {
          default: "#1c1c1c",
          paper: "#333333",
        },
        primary: {
          main: "#1ec8d8",
          light: "rgb(191, 250, 255)",
          dark: "rgb(18, 101, 109)",
          contrastText: "#1c1c1c",
        },
        secondary: {
          main: "rgb(0, 157, 172)",
          light: "rgb(224, 252, 255)",
          dark: "rgb(0, 108, 117)",
          contrastText: "#1c1c1c",
        },
        text: {
          primary: "#ffffff",
          secondary: "#bdbdbd",
        },
      },
    },
  },
  typography: {
    fontFamily: "'Lunasima', 'Arial', sans-serif",
    h1: { fontSize: "4rem", fontWeight: 700 },
    h2: { fontSize: "1.5rem", fontWeight: 600 },
    h3: { fontSize: "0.5rem", fontWeight: 500 },
    body1: { fontSize: "1rem", lineHeight: 1.5 },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});
