import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useOperationalSite } from '@/context/OperationalSiteContext';

export function SiteSelector() {
  const theme = useAppTheme();
  const { sites, selectedSiteId, setSelectedSiteId, isLoading, error } = useOperationalSite();
  if (isLoading && !sites.length) return <Text style={[styles.helper, { color: theme.textMuted }]}>Loading accessible sites…</Text>;
  if (error && !sites.length) return <Text style={[styles.helper, { color: theme.warning }]}>{error}</Text>;
  if (!sites.length) return <Text style={[styles.helper, { color: theme.textMuted }]}>No operational sites are available for this account.</Text>;
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.textMuted }]}>Site</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {sites.map((site) => {
          const active = site.id === selectedSiteId;
          return (
            <Pressable key={site.id} onPress={() => setSelectedSiteId(site.id)} style={[styles.chip, { backgroundColor: active ? theme.primary : theme.surfaceMuted, borderColor: active ? theme.primary : theme.border }]} accessibilityRole="button" accessibilityState={{ selected: active }}>
              <Text numberOfLines={1} style={[styles.name, { color: active ? theme.primaryText : theme.text }]}>{site.name}</Text>
              <Text style={[styles.role, { color: active ? theme.primaryText : theme.textMuted }]}>{site.role}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { fontSize: typography.micro, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  row: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: { minWidth: 132, maxWidth: 220, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2 },
  name: { fontSize: typography.small, fontWeight: '700' },
  role: { fontSize: typography.micro, textTransform: 'capitalize' },
  helper: { fontSize: typography.small, lineHeight: 18 },
});
