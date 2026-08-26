import { Image, StyleSheet, type ImageStyle, type StyleProp } from "react-native";
import { usePowerChainTheme } from "../../theme";
import { APP_ASSETS } from "../../shared/assets";

type LogoVariant = "auto" | "green" | "white" | "dark";

const sources = {
  green: APP_ASSETS.brand.logoGreen,
  white: APP_ASSETS.brand.logoWhite,
  dark: APP_ASSETS.brand.logoDark,
};

export function PowerChainLogo({
  size = 36,
  variant = "auto",
  style,
}: {
  size?: number;
  variant?: LogoVariant;
  style?: StyleProp<ImageStyle>;
}) {
  const { theme } = usePowerChainTheme();

  const resolved =
    variant === "auto"
      ? theme.dark
        ? "white"
        : "green"
      : variant;

  return (
    <Image
      accessibilityLabel="PowerChain"
      resizeMode="contain"
      source={sources[resolved]}
      style={[styles.base, { width: size, height: size }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    flexShrink: 0,
  },
});
