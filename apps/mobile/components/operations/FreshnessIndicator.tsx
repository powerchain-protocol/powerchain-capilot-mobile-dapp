import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { FreshnessState } from '@/types/operations';

export function FreshnessIndicator({ state, label }: { state: FreshnessState; label?: string }) {
  const theme = useAppTheme();
  const color = state === 'fresh' ? theme.success : state === 'stale' ? theme.warning : theme.textMuted;
  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceMuted }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label ?? state}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 26, borderRadius: radius.pill, paddingHorizontal: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  text: { fontSize: typography.micro, fontWeight: '700', textTransform: 'capitalize' },
});
