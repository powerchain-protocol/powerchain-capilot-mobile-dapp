import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/common/Card';
import { Screen } from '@/components/common/Screen';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function NotFoundScreen() {
  const theme = useAppTheme();

  return (
    <Screen>
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>Page not found</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>
          This route does not exist in the mobile application.
        </Text>
        <Link href="/" style={[styles.link, { color: theme.primary }]}>
          Return home
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.heading,
    fontWeight: '800',
  },
  body: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  link: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
