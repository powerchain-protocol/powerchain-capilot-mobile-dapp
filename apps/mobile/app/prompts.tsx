import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { Screen } from '@/components/common/Screen';
import { PROMPT_LIBRARY } from '@/constants/prompts';
import { COPILOT_RESPONSE_COST_LABEL } from '@/constants/pwrc';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const categoryLabels = {
  operations: 'Operations',
  evidence: 'Evidence',
  credits: 'PWRC Credits',
} as const;

export default function PromptLibraryScreen() {
  const theme = useAppTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
            <Text style={[styles.back, { color: theme.primary }]}>Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Prompt Library</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Focused operational prompts, including authenticated PWRC credit analysis.</Text>
        </View>

        {(['operations', 'evidence', 'credits'] as const).map((category) => (
          <View key={category} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{categoryLabels[category]}</Text>
            {PROMPT_LIBRARY.filter((item) => item.category === category).map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => router.replace({ pathname: '/copilot', params: { prompt: item.prompt } })}
                style={({ pressed }) => [
                  styles.promptPressable,
                  { borderColor: pressed ? theme.primary : 'transparent' },
                ]}
              >
                <Card compact>
                  <Text style={[styles.promptTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.promptDescription, { color: theme.textMuted }]}>{item.description}</Text>
                  <Text style={[styles.promptCost, { color: theme.primary }]}>{COPILOT_RESPONSE_COST_LABEL}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  header: { gap: spacing.sm },
  back: { fontSize: typography.small, fontWeight: '800' },
  title: { fontSize: typography.title, fontWeight: '800' },
  subtitle: { fontSize: typography.body, lineHeight: 23 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: typography.heading, fontWeight: '800', marginBottom: spacing.xs },
  promptPressable: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg },
  promptTitle: { fontSize: typography.body, fontWeight: '800' },
  promptDescription: { fontSize: typography.small, lineHeight: 19 },
  promptCost: { marginTop: spacing.xs, fontSize: typography.micro, fontWeight: '800' },
});
