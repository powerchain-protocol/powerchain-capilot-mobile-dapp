import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { StatusPill } from '@/components/common/StatusPill';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { SafeActionDecision } from '@/types/operations';

export function SafeActionPanel({ decision, isPreparing, error, onPrepare, label = 'Prepare action' }: {
  decision?: SafeActionDecision;
  isPreparing?: boolean;
  error?: string;
  onPrepare: () => void;
  label?: string;
}) {
  const theme = useAppTheme();
  return (
    <Card>
      <Text style={[styles.title, { color: theme.text }]}>Safety gate</Text>
      <Text style={[styles.body, { color: theme.textMuted }]}>Preparation never executes a physical dispatch or blockchain transaction. Review and wallet-signature requirements are enforced by the server policy.</Text>
      {decision ? (
        <View style={styles.decision}>
          <StatusPill label={decision.risk.replaceAll('_', ' ')} tone={decision.status === 'prepared' ? 'success' : decision.status === 'expired' ? 'warning' : 'danger'} />
          {decision.policyReasons.map((reason) => <Text key={reason} style={[styles.reason, { color: theme.textMuted }]}>• {reason}</Text>)}
        </View>
      ) : null}
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      {isPreparing ? <ActivityIndicator color={theme.primary} /> : <PrimaryButton label={label} onPress={onPrepare} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.heading, fontWeight: '700' },
  body: { fontSize: typography.small, lineHeight: 19 },
  decision: { gap: spacing.sm },
  reason: { fontSize: typography.small, lineHeight: 18 },
  error: { fontSize: typography.small, fontWeight: '600' },
});
