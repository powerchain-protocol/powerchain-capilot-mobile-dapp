import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { OperationalAlarmList } from '@/components/operations/OperationalAlarmList';
import { SiteSelector } from '@/components/operations/SiteSelector';
import { spacing, typography } from '@/constants/theme';
import { useOperationalSite } from '@/context/OperationalSiteContext';
import { useOperationalRole } from '@/context/RoleContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useOperationalAlarms } from '@/hooks/useOperationalAlarms';
import { useOperationalEvents } from '@/hooks/useOperationalEvents';

export default function AlertsScreen() {
  const theme = useAppTheme();
  const { role } = useOperationalRole();
  const { selectedSiteId } = useOperationalSite();
  const alarms = useOperationalAlarms(selectedSiteId, 'open');
  const events = useOperationalEvents(selectedSiteId);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>ROLE · {role.replace('_', ' ').toUpperCase()}</Text>
        <Text style={[styles.title, { color: theme.text }]}>Alerts</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>Operational alarms remain evidence-linked and site-scoped. Acknowledgement is prepared as a Safe Action rather than silently mutating state.</Text>
        <SiteSelector />
        {!selectedSiteId ? <EmptyState title="Select a site" description="Choose an authorized site to inspect alarms." /> : null}
        {selectedSiteId && alarms.alarms.length ? <OperationalAlarmList alarms={alarms.alarms} limit={50} /> : null}
        {selectedSiteId && !alarms.alarms.length ? <EmptyState title="No open alarms" description={alarms.error ?? 'No open alarms are currently reported for this site.'} /> : null}
        {selectedSiteId ? (
          <View style={styles.eventsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent operational events</Text>
            <Pressable onPress={() => router.push('/activity')}><Text style={[styles.link, { color: theme.primary }]}>View all</Text></Pressable>
          </View>
        ) : null}
        {selectedSiteId && events.events.length ? events.events.slice(0, 4).map((event) => (
          <Text key={event.id} style={[styles.event, { color: theme.textMuted }]}>• {event.summary} · {new Date(event.occurredAt).toLocaleString()}</Text>
        )) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  eyebrow: { fontSize: typography.micro, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: typography.title, fontWeight: '800' },
  body: { fontSize: typography.body, lineHeight: 23 },
  eventsHeader: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionTitle: { flex: 1, fontSize: typography.heading, fontWeight: '800' },
  link: { fontSize: typography.small, fontWeight: '800' },
  event: { fontSize: typography.small, lineHeight: 19 },
});
