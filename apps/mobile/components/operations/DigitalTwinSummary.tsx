import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/common/Card';
import { StatusPill } from '@/components/common/StatusPill';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { OperationalTwin } from '@/types/operations';
import { FreshnessIndicator } from './FreshnessIndicator';
import { OperationalMetric } from './OperationalMetric';

function tone(status: OperationalTwin['status']): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'operational') return 'success';
  if (status === 'degraded') return 'warning';
  if (status === 'offline') return 'danger';
  return 'neutral';
}

export function DigitalTwinSummary({ twin }: { twin: OperationalTwin }) {
  const theme = useAppTheme();
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]}>Site digital twin</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Computed projection from authoritative EMS, device, DePIN and alarm state.</Text>
        </View>
        <StatusPill label={twin.status} tone={tone(twin.status)} />
      </View>
      <View style={styles.metrics}>
        <OperationalMetric label="Generation" value={twin.telemetry.generationKw ?? '—'} unit={twin.telemetry.generationKw ? 'kW' : undefined} />
        <OperationalMetric label="Load" value={twin.telemetry.loadKw ?? '—'} unit={twin.telemetry.loadKw ? 'kW' : undefined} />
        <OperationalMetric label="IoT" value={`${twin.assets.iotOperational}/${twin.assets.iotTotal}`} />
        <OperationalMetric label="DePIN" value={`${twin.assets.depinOperational}/${twin.assets.depinTotal}`} />
        <OperationalMetric label="Open alarms" value={String(twin.alarms.open)} />
        <OperationalMetric label="Critical" value={String(twin.alarms.critical)} />
      </View>
      <FreshnessIndicator state={twin.sourceFreshness} label={`${twin.sourceFreshness} telemetry`} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', alignItems: 'flex-start' },
  heading: { flex: 1, gap: spacing.xs },
  title: { fontSize: typography.heading, fontWeight: '800' },
  subtitle: { fontSize: typography.small, lineHeight: 18 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
