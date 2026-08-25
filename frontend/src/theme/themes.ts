export type ThemeName = "light" | "dark" | "darkGreen";

export type ThemeTokens = {
  name: ThemeName;
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceRaised: string;
    surfaceSubtle: string;
    text: string;
    textMuted: string;
    border: string;
    borderStrong: string;
    primary: string;
    primaryPressed: string;
    primaryForeground: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    input: string;
    overlay: string;
    skeleton: string;
  };
};

export const lightTheme: ThemeTokens = {
  name: "light",
  dark: false,
  colors: {
    background: "#F7F8F7",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    surfaceSubtle: "#F1F4F2",
    text: "#101412",
    textMuted: "#66706B",
    border: "#E2E7E4",
    borderStrong: "#CDD5D0",
    primary: "#123D2C",
    primaryPressed: "#0E3325",
    primaryForeground: "#FFFFFF",
    success: "#18794E",
    warning: "#9A6700",
    danger: "#C9372C",
    info: "#2563EB",
    input: "#FFFFFF",
    overlay: "rgba(16,20,18,0.42)",
    skeleton: "#E7EBE8",
  },
};

export const darkTheme: ThemeTokens = {
  name: "dark",
  dark: true,
  colors: {
    background: "#0C100E",
    surface: "#131815",
    surfaceRaised: "#181F1B",
    surfaceSubtle: "#1D2520",
    text: "#F4F7F5",
    textMuted: "#9EA9A3",
    border: "#28322C",
    borderStrong: "#354239",
    primary: "#2E7D5B",
    primaryPressed: "#266B4E",
    primaryForeground: "#FFFFFF",
    success: "#42B883",
    warning: "#D5A53B",
    danger: "#F06A61",
    info: "#6C9CFF",
    input: "#151B17",
    overlay: "rgba(0,0,0,0.58)",
    skeleton: "#273129",
  },
};

export const darkGreenTheme: ThemeTokens = {
  name: "darkGreen",
  dark: true,
  colors: {
    background: "#07150F",
    surface: "#0B2118",
    surfaceRaised: "#0E2B20",
    surfaceSubtle: "#113426",
    text: "#F4F8F5",
    textMuted: "#A6B9AE",
    border: "#1D4937",
    borderStrong: "#285C47",
    primary: "#2E8A62",
    primaryPressed: "#267653",
    primaryForeground: "#FFFFFF",
    success: "#49C38A",
    warning: "#D5AB4E",
    danger: "#F06A61",
    info: "#6DA2FF",
    input: "#0D281D",
    overlay: "rgba(2,10,7,0.66)",
    skeleton: "#173D2E",
  },
};

export const themes: Record<ThemeName, ThemeTokens> = {
  light: lightTheme,
  dark: darkTheme,
  darkGreen: darkGreenTheme,
};

export function getTheme(name: ThemeName): ThemeTokens {
  return themes[name];
}
