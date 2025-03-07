// src/styles/theme.ts
import { createTheme } from "@mui/material/styles";

export const Theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: {
    light: {
      palette: {
        common: {
          black: '#000',
          white: '#fff',
        },    
        background: {
          default: "#F9F9FE",
          paper: "#EEEEF9",
        },
        primary: {
          main: "#9e03f2",
          light: "#c773f5",
          dark: "#aa1ff4",
          contrastText: "#ffffff",
        },
        secondary: {
          main: "#595959",
          light: "rgb(143, 143, 143)",
          dark: "#333333",
          contrastText: "#ffffff",
        },
        action: {
          hover: '#f5f5f5',
        },    
        text: {
          primary: "#333",
          secondary: "#555555",
        },
      },
    },
    dark: {
      palette: {
        common: {
          black: '#000',
          white: '#fff',
        }, 
        background: {
          default: "#1c1c1c",
          paper: "#333333",
        },
        primary: {
          main: "#1ec8d8",
          light: "rgb(191, 250, 255)",
          dark: "rgb(7 230 245)",
          contrastText: "#fff",
        },
        secondary: {
          main: "rgb(0, 157, 172)",
          light: "rgb(224, 252, 255)",
          dark: "rgb(0, 108, 117)",
          contrastText: "#1c1c1c",
        },
        action: {
          hover:'rgb(105, 105, 105)',
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
    h2: { fontSize: "2rem", fontWeight: 600 },
    h3: { fontSize: "1.5rem", fontWeight: 500 },
    body1: { fontSize: "1rem", lineHeight: 1.5 },
    button: { textTransform: "none", fontSize: "0.875rem" },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        containedPrimary: {
          backgroundColor: "#aa1ff4",
          "&:hover": {
            backgroundColor: "#8e1ad0",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#333333",
          color: "#ffffff",
          textAlign: "center",
          fontWeight: 600,
        },
        body: {
          fontSize: 14,
          textAlign: "center",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(odd)": {
            backgroundColor: "#f5f5f5",
          },
          "&:nth-of-type(odd).Mui-selected": {
            backgroundColor: "rgba(170, 31, 244, 0.15)",
          },
        },
      },
    },
  },
});
