import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { SiteSelector } from '@/components/operations/SiteSelector';
import { SourceBadge } from '@/components/operations/SourceBadge';
import { spacing, typography } from '@/constants/theme';
import { useOperationalSite } from '@/context/OperationalSiteContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useOperationalEvents } from '@/hooks/useOperationalEvents';

export default function ActivityScreen() {
  const theme = useAppTheme();
  const { selectedSiteId } = useOperationalSite();
  const { events, error, isLoading, isRefreshing, isStale, refresh } = useOperationalEvents(selectedSiteId);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Activity</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Authoritative operational events from EMS, IoT, DePIN and alarm ingestion.</Text>
        <SiteSelector />

        {error ? <Text style={[styles.error, { color: theme.warning }]} onPress={() => void refresh()}>{error} · Tap to retry</Text> : null}
        {isStale && events.length ? <Text style={[styles.stale, { color: theme.warning }]}>Showing cached activity while a fresh read is unavailable.</Text> : null}
        {isLoading || isRefreshing ? <Text style={[styles.helper, { color: theme.textMuted }]}>Refreshing activity…</Text> : null}

        {!selectedSiteId ? (
          <Card><EmptyState title="Select an operational site" description="Activity is scoped to an authenticated site. The app does not synthesize events when no site is available." /></Card>
        ) : !events.length && !isLoading ? (
          <Card><EmptyState title="No activity loaded" description="No server-backed operational events were returned for this site." /></Card>
        ) : (
          <View style={styles.list}>
            {events.map((event) => (
              <Card key={event.id}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: theme.text }]}>{event.summary}</Text>
                  <Text style={[styles.kind, { color: theme.primary }]}>{event.kind.toUpperCase()}</Text>
                </View>
                <Text style={[styles.meta, { color: theme.textMuted }]}>{event.type} · {new Date(event.occurredAt).toLocaleString()}</Text>
                <SourceBadge source={event.source} />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  title: { fontSize: typography.title, fontWeight: '800' },
  subtitle: { fontSize: typography.body, lineHeight: 24, marginBottom: spacing.sm },
  list: { gap: spacing.sm },
  eventHeader: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'flex-start' },
  eventTitle: { flex: 1, fontSize: typography.body, fontWeight: '700' },
  kind: { fontSize: typography.micro, fontWeight: '800', letterSpacing: 0.7 },
  meta: { fontSize: typography.small, lineHeight: 18 },
  helper: { fontSize: typography.small },
  stale: { fontSize: typography.small, fontWeight: '600' },
  error: { fontSize: typography.small, fontWeight: '600' },
});
