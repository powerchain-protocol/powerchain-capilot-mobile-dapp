import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

type CardProps = PropsWithChildren<{
  compact?: boolean;
}>;

export function Card({ children, compact = false }: CardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.base,
        compact && styles.compact,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  compact: {
    padding: spacing.md,
  },
});
