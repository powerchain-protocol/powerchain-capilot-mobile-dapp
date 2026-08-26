import Constants from 'expo-constants';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { Screen } from '@/components/common/Screen';
import { StatusPill } from '@/components/common/StatusPill';
import { env } from '@/config/env';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

function SettingRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text selectable style={[styles.rowValue, { color: theme.text }]}>
        {value}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const apiConfigured = Boolean(env.apiBaseUrl);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Build identity and public runtime configuration for this installation.
        </Text>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Runtime</Text>
          <StatusPill
            label={apiConfigured ? 'API configured' : 'API not configured'}
            tone={apiConfigured ? 'success' : 'warning'}
          />
          <SettingRow label="Environment" value={env.appEnv} />
          <SettingRow label="API origin" value={env.apiBaseUrl ?? 'Not configured'} />
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Build</Text>
          <SettingRow label="Version" value={Constants.expoConfig?.version ?? 'Unknown'} />
          <SettingRow label="Application" value={Constants.expoConfig?.name ?? 'PowerChain Copilot'} />
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Security note</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            EXPO_PUBLIC variables are visible to the client. Keep service credentials, signing keys, wallet secrets, and privileged tokens on trusted server infrastructure.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  row: {
    paddingTop: spacing.sm,
    gap: 2,
  },
  rowLabel: {
    fontSize: typography.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rowValue: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  body: {
    fontSize: typography.small,
    lineHeight: 20,
  },
});
