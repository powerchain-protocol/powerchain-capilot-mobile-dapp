import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    maxWidth: 360,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },
});
