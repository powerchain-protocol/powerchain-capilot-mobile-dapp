import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PowerChainLogo } from '@/components/brand/Logo';
import { Composer } from '@/components/chat/Composer';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { env } from '@/config/env';
import { COPILOT_SUGGESTIONS } from '@/constants/prompts';
import { COPILOT_RESPONSE_COST_LABEL } from '@/constants/pwrc';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCopilot } from '@/hooks/useCopilot';
import { useCredits } from '@/hooks/useCredits';
import { formatPwrcBaseUnits } from '@/lib/pwrc';

export default function CopilotScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ prompt?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const { authenticated, messages, lastCharge, isSending, error, insufficientCredits, sendMessage, clearConversation } = useCopilot();
  const { account: creditAccount, refresh: refreshCredits } = useCredits();
  const apiConfigured = Boolean(env.apiBaseUrl);
  const managedAiEnabled = env.managedAiEnabled;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (typeof params.prompt === 'string' && params.prompt.trim()) setDraft(params.prompt);
  }, [params.prompt]);

  const subtitle = useMemo(() => {
    if (!managedAiEnabled) return `AI mode is ${env.aiMode}; managed provider routing is disabled for this build.`;
    if (!apiConfigured) return 'Configure the API origin to send messages.';
    if (!authenticated) return 'Sign in to use PWRC-metered responses.';
    return 'Managed AI routing is enabled and connected to the configured PowerChain API.';
  }, [apiConfigured, authenticated, managedAiEnabled]);

  async function submit() {
    const text = draft;
    if (!text.trim()) return;
    setDraft('');
    const sent = await sendMessage(text);
    if (sent) await refreshCredits();
    else setDraft(text);
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0} style={styles.flex}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerText}>
            <PowerChainLogo compact size={30} />
            <Text style={[styles.title, { color: theme.text }]}>Copilot</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
            {creditAccount ? <Text style={[styles.creditSummary, { color: theme.primary }]}>{creditAccount.availablePwrc} PWRC available · {creditAccount.responseCreditsRemaining} responses remaining</Text> : null}
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/prompts')} hitSlop={8}>
              <Text style={[styles.action, { color: theme.primary }]}>Prompts</Text>
            </Pressable>
            {hasMessages ? (
              <Pressable accessibilityRole="button" onPress={clearConversation} hitSlop={8}>
                <Text style={[styles.action, { color: theme.primary }]}>New</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {!managedAiEnabled || !apiConfigured || !authenticated ? (
          <View style={styles.noticeWrap}>
            <Card compact>
              <Text style={[styles.noticeTitle, { color: theme.warning }]}>{!managedAiEnabled ? 'Managed AI disabled' : !apiConfigured ? 'API configuration required' : 'Authentication required'}</Text>
              <Text style={[styles.noticeBody, { color: theme.textMuted }]}>{!managedAiEnabled ? 'Set EXPO_PUBLIC_AI_MODE=managed to enable the managed provider router.' : !apiConfigured ? 'Set EXPO_PUBLIC_API_URL for this build. No request is attempted until a valid base URL is configured.' : 'Copilot, credit pricing, account balances, and ledger APIs require an authenticated user session.'}</Text>
            </Card>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.messages, !hasMessages && styles.emptyMessages]}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {hasMessages ? (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          ) : (
            <View style={styles.emptyWrap}>
              <EmptyState title="Start an operational analysis" description="Each completed response is quoted and reserved in integer PWRC base units before generation; failed generations release their reservation." />
              <View style={styles.suggestions}>
                {COPILOT_SUGGESTIONS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    accessibilityRole="button"
                    onPress={() => setDraft(suggestion)}
                    style={({ pressed }) => [styles.suggestion, { backgroundColor: theme.surface, borderColor: pressed ? theme.primary : theme.border }]}
                  >
                    <Text style={[styles.suggestionText, { color: theme.text }]}>{suggestion}</Text>
                    <Text style={[styles.suggestionCost, { color: theme.primary }]}>{COPILOT_RESPONSE_COST_LABEL}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {lastCharge ? (
          <View style={styles.chargeWrap}>
            <Text style={[styles.charge, { color: theme.textMuted }]}>{'Settled · 1 MSG UNIT'} · {lastCharge.receipt?.responseId ?? 'pmsg'} · {lastCharge.chargedPwrc ?? formatPwrcBaseUnits(lastCharge.chargedBaseUnits)} PWRC · ≈ $0.02 ref</Text>
          </View>
        ) : null}

        {insufficientCredits ? (
          <View style={styles.creditRecoveryWrap}>
            <Card compact>
              <Text style={[styles.noticeTitle, { color: theme.warning }]}>PWRC credits required</Text>
              <Text style={[styles.noticeBody, { color: theme.textMuted }]}>Available: {insufficientCredits.availableBaseUnits ? `${formatPwrcBaseUnits(insufficientCredits.availableBaseUnits)} PWRC` : 'unavailable'} · Required: {insufficientCredits.requiredBaseUnits ? `${formatPwrcBaseUnits(insufficientCredits.requiredBaseUnits)} PWRC` : '10,000 PWRC'}</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/copilot-credits')} style={styles.recoveryAction}>
                <Text style={[styles.action, { color: theme.primary }]}>Open Credits</Text>
              </Pressable>
            </Card>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorWrap}>
            <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{error}</Text>
          </View>
        ) : null}

        <Composer disabled={isSending || !managedAiEnabled || !apiConfigured || !authenticated} onChangeText={setDraft} onSubmit={submit} value={draft} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { minHeight: 72, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.md },
  title: { fontSize: typography.heading, fontWeight: '800' },
  subtitle: { fontSize: typography.small, lineHeight: 18 },
  creditSummary: { marginTop: 2, fontSize: typography.micro, lineHeight: 16, fontWeight: '800' },
  action: { fontSize: typography.small, fontWeight: '800' },
  noticeWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  noticeTitle: { fontSize: typography.small, fontWeight: '800' },
  noticeBody: { fontSize: typography.small, lineHeight: 19 },
  messages: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  emptyMessages: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap: { width: '100%' },
  suggestions: { gap: spacing.sm },
  suggestion: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  suggestionText: { fontSize: typography.small, lineHeight: 19, fontWeight: '600' },
  suggestionCost: { marginTop: spacing.xs, fontSize: typography.micro, fontWeight: '800' },
  chargeWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  charge: { fontSize: typography.micro, lineHeight: 16 },
  creditRecoveryWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  recoveryAction: { alignSelf: 'flex-start', paddingTop: spacing.sm },
  errorWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  error: { fontSize: typography.small, lineHeight: 18 },
});
