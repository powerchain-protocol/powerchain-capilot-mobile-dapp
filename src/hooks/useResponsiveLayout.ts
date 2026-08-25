import { useWindowDimensions } from "react-native";
import { BREAKPOINTS, LAYOUT } from "../constants/layout";

export type LayoutMode = "mobile" | "tablet" | "desktop";
export type Orientation = "portrait" | "landscape";

export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();

  const shortestEdge = Math.min(width, height);
  const orientation: Orientation =
    width > height ? "landscape" : "portrait";

  const desktop = width >= BREAKPOINTS.desktop;

  // A phone in landscape may be >768px wide, but its shortest edge
  // remains phone-sized. Keep it in the mobile interaction model.
  const tablet =
    !desktop &&
    width >= BREAKPOINTS.tablet &&
    shortestEdge >= 600;

  const mode: LayoutMode = desktop
    ? "desktop"
    : tablet
      ? "tablet"
      : "mobile";

  const isMobile = mode === "mobile";
  const isTablet = mode === "tablet";
  const isDesktop = mode === "desktop";
  const isLandscape = orientation === "landscape";
  const isPortrait = !isLandscape;

  const horizontalPadding = isMobile
    ? LAYOUT.mobileGutter
    : isTablet
      ? LAYOUT.tabletGutter
      : LAYOUT.desktopGutter;

  const contentMaxWidth = isDesktop
    ? LAYOUT.desktopMaxWidth
    : isTablet
      ? 1040
      : 720;

  const gridColumns = isDesktop ? 3 : isTablet ? 2 : 1;

  const compactHeight = height < 620;
  const compactWidth = width < 390;

  return {
    width,
    height,
    shortestEdge,
    fontScale,
    orientation,
    mode,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isPortrait,
    compactHeight,
    compactWidth,
    horizontalPadding,
    contentMaxWidth,
    gridColumns,
  };
}
