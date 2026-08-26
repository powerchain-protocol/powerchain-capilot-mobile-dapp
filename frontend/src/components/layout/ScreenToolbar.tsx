import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PowerChainLogo } from "../brand";
import { Button, StatusBadge } from "../ui";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { usePowerChainTheme } from "../../theme";
import { spacing, typography } from "../../theme/tokens";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type ScreenToolbarAction = {
  label: string;
  icon: IconName;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

export function ScreenToolbar({
  title,
  description,
  eyebrow,
  badge,
  actions = [],
  showBrand = true,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  badge?: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" };
  actions?: ScreenToolbarAction[];
  showBrand?: boolean;
}) {
  const { theme } = usePowerChainTheme();
  const { isMobile } = useResponsiveLayout();

  return (
    <View style={[styles.shell, { borderBottomColor: theme.colors.border }]}> 
      <View style={styles.headingRow}>
        {showBrand && isMobile ? (
          <View style={[styles.logoChip, { backgroundColor: theme.colors.surface }]}> 
            <PowerChainLogo size={34} variant="green" />
          </View>
        ) : null}
        <View style={styles.copy}>
          <View style={styles.metaRow}>
            {eyebrow ? <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>{eyebrow}</Text> : null}
            {badge ? <StatusBadge label={badge.label} tone={badge.tone} /> : null}
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          {description ? <Text style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text> : null}
        </View>
      </View>

      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Button
              key={action.label}
              label={action.label}
              size="sm"
              variant={action.variant ?? "secondary"}
              onPress={action.onPress}
              left={<MaterialCommunityIcons name={action.icon} size={17} color={action.variant === "primary" ? theme.colors.primaryForeground : theme.colors.text} />}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    minWidth: 0,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, minWidth: 0 },
  logoChip: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm, marginBottom: 3 },
  eyebrow: { ...typography.caption, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  title: { ...typography.h1 },
  description: { ...typography.body, marginTop: spacing.xs, maxWidth: 760 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
