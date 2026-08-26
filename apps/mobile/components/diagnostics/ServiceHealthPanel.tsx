import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/common/Card';
import { StatusPill } from '@/components/common/StatusPill';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { DiagnosticsPayload } from '@/types/diagnostics';

export function ServiceHealthPanel({ diagnostics }: { diagnostics: DiagnosticsPayload }) {
  const theme = useAppTheme();
  const checks = [
    {
      label: 'Managed AI',
      ok: diagnostics.ai.providers.length > 0,
      detail: diagnostics.ai.readiness?.length
        ? diagnostics.ai.readiness.map((provider) => `${provider.name}:${provider.status === 'configured' ? 'ready' : 'off'}`).join(' · ')
        : diagnostics.ai.providers.join(', ') || 'No configured providers',
    },
    { label: 'Secure chat', ok: diagnostics.chat.enabled && diagnostics.chat.encryptedAtRest, detail: diagnostics.chat.memoryEnabled ? 'Encrypted + memory enabled' : 'Encrypted' },
    { label: 'Operations', ok: diagnostics.operations.configured, detail: diagnostics.operations.dataMode },
    { label: 'Solana', ok: Boolean(diagnostics.networks.solana.cluster), detail: `${diagnostics.networks.solana.cluster} · ${diagnostics.networks.solana.provider}` },
    { label: 'Sui', ok: Boolean(diagnostics.networks.sui.network), detail: diagnostics.networks.sui.network },
    { label: 'Rate limits', ok: true, detail: diagnostics.rateLimit.store },
  ];
  return (
    <View style={styles.stack}>
      {checks.map((check) => (
        <Card key={check.label} compact>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={[styles.title, { color: theme.text }]}>{check.label}</Text>
              <Text style={[styles.detail, { color: theme.textMuted }]}>{check.detail}</Text>
            </View>
            <StatusPill label={check.ok ? 'Ready' : 'Needs config'} tone={check.ok ? 'success' : 'warning'} />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  title: { fontSize: typography.body, fontWeight: '800' },
  detail: { marginTop: 2, fontSize: typography.small, lineHeight: 18 },
});
