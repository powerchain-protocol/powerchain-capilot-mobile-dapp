import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/common/Card';
import { StatusPill } from '@/components/common/StatusPill';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { TelemetryIntegrityReport } from '@/types/operations';
import { FreshnessIndicator } from './FreshnessIndicator';

function tone(state: TelemetryIntegrityReport['state']): 'success' | 'warning' | 'neutral' {
  return state === 'healthy' ? 'success' : state === 'degraded' ? 'warning' : 'neutral';
}

export function TelemetryIntegrityCard({ integrity }: { integrity: TelemetryIntegrityReport }) {
  const theme = useAppTheme();
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]}>Telemetry integrity</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Freshness, availability and alarm checks derived from authorized site state.</Text>
        </View>
        <StatusPill label={integrity.state.replace('_', ' ')} tone={tone(integrity.state)} />
      </View>
      <FreshnessIndicator state={integrity.freshness} />
      <View style={styles.checks}>
        {integrity.checks.map((check) => (
          <View key={check.name} style={styles.checkRow}>
            <Text style={[styles.checkName, { color: theme.text }]}>{check.name.replaceAll('_', ' ')}</Text>
            <Text style={[styles.detail, { color: theme.textMuted }]}>{check.detail}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.note, { color: theme.textMuted }]}>Integrity state is observational. It never authorizes physical dispatch or settlement execution.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', justifyContent: 'space-between' },
  heading: { flex: 1, gap: spacing.xs },
  title: { fontSize: typography.heading, fontWeight: '800' },
  subtitle: { fontSize: typography.small, lineHeight: 18 },
  checks: { gap: spacing.sm },
  checkRow: { gap: 2 },
  checkName: { fontSize: typography.small, fontWeight: '800', textTransform: 'capitalize' },
  detail: { fontSize: typography.small, lineHeight: 18 },
  note: { fontSize: typography.micro, lineHeight: 16 },
});
