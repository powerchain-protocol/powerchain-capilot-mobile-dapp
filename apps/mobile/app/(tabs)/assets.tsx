import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { FreshnessIndicator } from '@/components/operations/FreshnessIndicator';
import { SiteSelector } from '@/components/operations/SiteSelector';
import { spacing, typography } from '@/constants/theme';
import { useOperationalSite } from '@/context/OperationalSiteContext';
import { useOperationalRole } from '@/context/RoleContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDepinNodes } from '@/hooks/useDepinNodes';
import { useIotDevices } from '@/hooks/useIotDevices';

export default function AssetsScreen() {
  const theme = useAppTheme();
  const { role } = useOperationalRole();
  const { selectedSiteId } = useOperationalSite();
  const devices = useIotDevices(selectedSiteId);
  const nodes = useDepinNodes(selectedSiteId);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>ROLE · {role.replace('_', ' ').toUpperCase()}</Text>
          <Text style={[styles.title, { color: theme.text }]}>Assets & Infrastructure</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>Site-scoped IoT devices and DePIN nodes with explicit freshness and source state.</Text>
        </View>
        <SiteSelector />
        {!selectedSiteId ? <EmptyState title="Select a site" description="Asset state is never loaded outside an authorized operational site." /> : null}
        {selectedSiteId ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>IoT devices</Text>
            {devices.devices.length ? devices.devices.slice(0, 12).map((device) => (
              <Card key={device.id} compact>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{device.label}</Text>
                    <Text style={[styles.meta, { color: theme.textMuted }]}>{device.kind} · {device.status}</Text>
                  </View>
                  <FreshnessIndicator state={device.source.freshness} />
                </View>
              </Card>
            )) : <EmptyState title="No devices" description={devices.error ?? 'No authorized IoT devices are available for this site.'} />}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>DePIN nodes</Text>
            {nodes.nodes.length ? nodes.nodes.slice(0, 12).map((node) => (
              <Card key={node.id} compact>
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{node.peerId ?? node.id}</Text>
                    <Text style={[styles.meta, { color: theme.textMuted }]}>{node.network} · {node.status}</Text>
                  </View>
                  <FreshnessIndicator state={node.source.freshness} />
                </View>
              </Card>
            )) : <EmptyState title="No DePIN nodes" description={nodes.error ?? 'No authorized DePIN nodes are available for this site.'} />}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  header: { gap: spacing.sm },
  eyebrow: { fontSize: typography.micro, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: typography.title, fontWeight: '800' },
  body: { fontSize: typography.body, lineHeight: 23 },
  sectionTitle: { marginTop: spacing.md, fontSize: typography.heading, fontWeight: '800' },
  cardTitle: { fontSize: typography.body, fontWeight: '800' },
  meta: { marginTop: 3, fontSize: typography.small },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
