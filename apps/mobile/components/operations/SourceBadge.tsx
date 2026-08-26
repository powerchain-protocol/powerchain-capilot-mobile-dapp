import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { SourceMetadata } from '@/types/operations';

export function SourceBadge({ source }: { source: SourceMetadata }) {
  const theme = useAppTheme();
  const tone = source.freshness === 'fresh' ? theme.success : source.freshness === 'stale' ? theme.warning : theme.textMuted;
  const observed = source.observedAt ? new Date(source.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No timestamp';
  const sequence = source.sequence ? ` · #${source.sequence}` : '';
  return (
    <View style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[styles.text, { color: theme.textMuted }]} numberOfLines={1}>
        {source.mode.toUpperCase()} · {source.source} · {source.freshness} · {observed}{sequence}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { minHeight: 28, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, alignSelf: 'flex-start', maxWidth: '100%' },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  text: { fontSize: typography.micro, fontWeight: '600', flexShrink: 1, textTransform: 'capitalize' },
});
