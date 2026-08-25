import { Image, StyleSheet, type ImageStyle, type StyleProp } from "react-native";
import { usePowerChainTheme } from "../../theme";

type LogoVariant = "auto" | "green" | "white" | "dark";

const sources = {
  green: require("../../../assets/brand/logo-green.png"),
  white: require("../../../assets/brand/logo-white.png"),
  dark: require("../../../assets/brand/logo-dark.png"),
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
