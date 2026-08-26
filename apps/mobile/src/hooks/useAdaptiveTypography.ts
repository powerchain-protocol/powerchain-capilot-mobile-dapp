import { useResponsiveLayout } from "./useResponsiveLayout";

export function useAdaptiveTypography() {
  const {
    isMobile,
    isDesktop,
    compactWidth,
    fontScale,
  } = useResponsiveLayout();

  const scaleGuard = fontScale > 1.25 ? 0.94 : 1;

  return {
    pageTitle: {
      fontSize:
        (compactWidth
          ? 22
          : isDesktop
            ? 28
            : isMobile
              ? 24
              : 26) * scaleGuard,
      lineHeight:
        (compactWidth
          ? 28
          : isDesktop
            ? 34
            : isMobile
              ? 30
              : 32) * scaleGuard,
      fontWeight: "700" as const,
    },
    sectionTitle: {
      fontSize: (isDesktop ? 19 : 18) * scaleGuard,
      lineHeight: (isDesktop ? 25 : 24) * scaleGuard,
      fontWeight: "600" as const,
    },
    body: {
      fontSize: 15 * scaleGuard,
      lineHeight: 22 * scaleGuard,
      fontWeight: "400" as const,
    },
  };
}
