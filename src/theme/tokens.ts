export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  card: 14,
  xl: 16,
  sheet: 20,
  modal: 20,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: "700" as const },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: "700" as const },
  h2: { fontSize: 21, lineHeight: 27, fontWeight: "700" as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "400" as const },
} as const;
