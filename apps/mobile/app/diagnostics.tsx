import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ServiceHealthPanel } from '@/components/diagnostics/ServiceHealthPanel';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { useOperationalHealth } from '@/hooks/useOperationalHealth';

export default function DiagnosticsScreen() {
  const theme = useAppTheme();
  const diagnostics = useDiagnostics();
  const publicHealth = useOperationalHealth();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.flex}>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>SERVICE HEALTH</Text>
            <Text style={[styles.title, { color: theme.text }]}>Diagnostics</Text>
          </View>
          <Pressable onPress={() => router.back()}><Text style={[styles.action, { color: theme.primary }]}>Done</Text></Pressable>
        </View>
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Public API health</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>{publicHealth.health ? `${publicHealth.health.status} · ${publicHealth.health.checks.length} checks` : publicHealth.error ?? 'Loading health state…'}</Text>
        </Card>
        {diagnostics.diagnostics ? <ServiceHealthPanel diagnostics={diagnostics.diagnostics} /> : null}
        {!diagnostics.diagnostics && diagnostics.error ? <EmptyState title="Diagnostics unavailable" description={diagnostics.error} /> : null}
        <Text style={[styles.note, { color: theme.textMuted }]}>Diagnostics are sanitized. API keys, RPC secrets, database URLs, bearer credentials and private infrastructure endpoints are never returned.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  eyebrow: { fontSize: typography.micro, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: typography.title, fontWeight: '800' },
  action: { fontSize: typography.small, fontWeight: '800' },
  cardTitle: { fontSize: typography.body, fontWeight: '800' },
  body: { fontSize: typography.small, lineHeight: 19 },
  note: { fontSize: typography.micro, lineHeight: 16 },
});
