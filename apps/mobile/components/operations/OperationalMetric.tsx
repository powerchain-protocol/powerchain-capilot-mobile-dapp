import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Measurement } from '@/types/operations';

type Props = {
  label: string;
  measurement?: Measurement;
  value?: string;
  unit?: string;
  helper?: string;
};

export function OperationalMetric({ label, measurement, value, unit, helper }: Props) {
  const theme = useAppTheme();
  const resolved = measurement ?? { value: value ?? '—', unit: unit ?? '' };
  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.text }]}>{resolved.value}</Text>
        {resolved.unit ? <Text style={[styles.unit, { color: theme.textMuted }]}>{resolved.unit}</Text> : null}
      </View>
      {helper ? <Text style={[styles.helper, { color: theme.textMuted }]}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs, minWidth: 120, flex: 1 },
  label: { fontSize: typography.small, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  value: { fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  unit: { fontSize: typography.small, fontWeight: '600' },
  helper: { fontSize: typography.micro },
});
