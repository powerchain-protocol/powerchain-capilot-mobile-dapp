import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatPwrcCompact } from '@/lib/pwrc';

type CreditBalanceProps = {
  label: string;
  baseUnits: string;
  emphasized?: boolean;
};

export function CreditBalance({ label, baseUnits, emphasized = false }: CreditBalanceProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.balance,
        { backgroundColor: emphasized ? theme.surfaceMuted : theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: emphasized ? theme.primary : theme.text }]}>
        {formatPwrcCompact(baseUnits)} PWRC
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  balance: {
    minWidth: '47%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.micro,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  value: {
    fontSize: typography.body,
    fontWeight: '800',
  },
});
