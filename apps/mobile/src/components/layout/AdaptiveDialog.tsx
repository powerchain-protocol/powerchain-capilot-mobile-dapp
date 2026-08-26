import type { PropsWithChildren } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { usePowerChainTheme } from "../../theme";
import { radius } from "../../theme/tokens";

export function AdaptiveDialog({
  visible,
  onClose,
  children,
  maxWidth = 560,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  maxWidth?: number;
}>) {
  const { theme } = usePowerChainTheme();
  const { isMobile } = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      visible={visible}
      animationType={isMobile ? "slide" : "fade"}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: theme.colors.overlay,
            justifyContent: isMobile ? "flex-end" : "center",
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Close dialog"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.panel,
            {
              maxWidth: isMobile ? undefined : maxWidth,
              paddingBottom: Math.max(
                16,
                isMobile ? insets.bottom + 12 : 20,
              ),
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderBottomLeftRadius: isMobile ? 0 : radius.sheet,
              borderBottomRightRadius: isMobile ? 0 : radius.sheet,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
  },
  panel: {
    width: "100%",
    minWidth: 0,
    maxHeight: "88%",
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
});
