import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PowerChainLogo } from '@/components/brand/Logo';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { StatusPill } from '@/components/common/StatusPill';
import { DigitalTwinSummary } from '@/components/operations/DigitalTwinSummary';
import { OperationalAlarmList } from '@/components/operations/OperationalAlarmList';
import { SiteSelector } from '@/components/operations/SiteSelector';
import { TelemetryIntegrityCard } from '@/components/operations/TelemetryIntegrityCard';
import { env } from '@/config/env';
import { spacing, typography } from '@/constants/theme';
import { useOperationalSite } from '@/context/OperationalSiteContext';
import { useOperationalRole } from '@/context/RoleContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useOperationalAlarms } from '@/hooks/useOperationalAlarms';
import { useOperationalHealth } from '@/hooks/useOperationalHealth';
import { useOperationalTwin } from '@/hooks/useOperationalTwin';
import { useTelemetryIntegrity } from '@/hooks/useTelemetryIntegrity';

const ROLE_FOCUS = {
  operator: ['Review current alarms', 'Inspect site digital twin', 'Prepare an operational analysis'],
  asset_manager: ['Review asset performance', 'Inspect stale device telemetry', 'Compare generation and load'],
  maintenance: ['Review device health', 'Inspect open maintenance alarms', 'Prepare a safe refresh action'],
  treasury: ['Review PWRC credit capacity', 'Inspect settlement context', 'Open capital-analysis Copilot'],
  admin: ['Review service diagnostics', 'Inspect risk and policy state', 'Validate provider readiness'],
} as const;

export default function CommandScreen() {
  const theme = useAppTheme();
  const apiConfigured = Boolean(env.apiBaseUrl);
  const { role } = useOperationalRole();
  const { selectedSiteId } = useOperationalSite();
  const twinQuery = useOperationalTwin(selectedSiteId);
  const integrityQuery = useTelemetryIntegrity(selectedSiteId);
  const alarmQuery = useOperationalAlarms(selectedSiteId, 'open');
  const health = useOperationalHealth();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <PowerChainLogo />
          <Text style={[styles.eyebrow, { color: theme.primary }]}>COMMAND CENTER · {role.replace('_', ' ').toUpperCase()}</Text>
          <Text style={[styles.title, { color: theme.text }]}>Operational control, evidence first.</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Monitor renewable infrastructure, inspect trustworthy state and prepare bounded actions without bypassing human or wallet approval.</Text>
          <View style={styles.statusRow}>
            <StatusPill label={apiConfigured ? 'API configured' : 'API not configured'} tone={apiConfigured ? 'success' : 'warning'} />
            <StatusPill label={health.health?.status === 'ok' ? 'Services healthy' : health.health?.status ?? 'Health pending'} tone={health.health?.status === 'ok' ? 'success' : 'warning'} />
          </View>
        </View>

        <SiteSelector />
        {twinQuery.twin ? <DigitalTwinSummary twin={twinQuery.twin} /> : null}
        {integrityQuery.integrity ? <TelemetryIntegrityCard integrity={integrityQuery.integrity} /> : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Next best actions</Text>
        {ROLE_FOCUS[role].map((label, index) => (
          <Card key={label} compact>
            <Text style={[styles.actionTitle, { color: theme.text }]}>{index + 1}. {label}</Text>
            <Text style={[styles.cardBody, { color: theme.textMuted }]}>Role-oriented presentation only; backend tenant policy and Safe Action authorization remain authoritative.</Text>
          </Card>
        ))}

        {selectedSiteId ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Open alarms</Text>
            <OperationalAlarmList alarms={alarmQuery.alarms} limit={3} />
          </>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton label="Open Copilot" onPress={() => router.push('/copilot')} />
          <PrimaryButton label="Service Diagnostics" onPress={() => router.push('/diagnostics')} />
        </View>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>PWRC completed-response billing</Text>
          <Text style={[styles.cardBody, { color: theme.textMuted }]}>1 completed response = 1 MSG UNIT = 10,000 PWRC ≈ $0.02 configured reference value. The $0.000002/PWRC reference is not a live market price. Provider fallback and approved read-only MCP calls stay inside one reservation.</Text>
          <View style={styles.creditAction}><PrimaryButton label="Open PWRC credit center" onPress={() => router.push('/copilot-credits')} /></View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  hero: { gap: spacing.md, marginBottom: spacing.sm },
  eyebrow: { fontSize: typography.micro, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: typography.title, lineHeight: 34, fontWeight: '800' },
  subtitle: { fontSize: typography.body, lineHeight: 24 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sectionTitle: { marginTop: spacing.md, fontSize: typography.heading, fontWeight: '800' },
  actionTitle: { fontSize: typography.body, fontWeight: '800' },
  cardTitle: { fontSize: typography.body, fontWeight: '800' },
  cardBody: { fontSize: typography.small, lineHeight: 19 },
  actions: { gap: spacing.sm },
  creditAction: { marginTop: spacing.md },
});
