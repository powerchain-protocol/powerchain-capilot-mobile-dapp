import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger';

type StatusPillProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  const theme = useAppTheme();
  const color =
    tone === 'success'
      ? theme.success
      : tone === 'warning'
        ? theme.warning
        : tone === 'danger'
          ? theme.danger
          : theme.textMuted;

  return (
    <View style={[styles.pill, { backgroundColor: theme.surfaceMuted }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 30,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: typography.small,
    fontWeight: '600',
  },
});
