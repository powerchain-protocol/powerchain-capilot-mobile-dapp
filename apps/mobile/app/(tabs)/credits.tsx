import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CreditBalance } from '@/components/credits/CreditBalance';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { StatusPill } from '@/components/common/StatusPill';
import { PWRC_IDENTITY } from '@/constants/pwrc';
import { radius, spacing, typography } from '@/constants/theme';
import { useCredits } from '@/hooks/useCredits';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatPwrcBaseUnits, pwrcWholeTokensToBaseUnits } from '@/lib/pwrc';
import type { CreditLedgerEntry } from '@/types/credits';

const FALLBACK_TOP_UP_PRESETS = [
  { pwrc: '500000', responses: '50', referenceValueUsd: '1.00' },
  { pwrc: '2500000', responses: '250', referenceValueUsd: '5.00' },
  { pwrc: '5000000', responses: '500', referenceValueUsd: '10.00' },
  { pwrc: '10000000', responses: '1000', referenceValueUsd: '20.00' },
] as const;

const ledgerLabels: Record<CreditLedgerEntry['type'], string> = {
  demo_grant: 'Sample grant',
  payment_credit: 'Verified payment credit',
  reservation_created: 'Response reserved',
  reservation_settled: 'Response settled',
  reservation_released: 'Reservation released',
  reservation_expired: 'Expired reservation recovered',
  settlement_refund: 'Settlement refund',
  settlement_reversal: 'Settlement reversal',
};

function availableDelta(entry: CreditLedgerEntry) {
  const units = BigInt(entry.availableDeltaBaseUnits);
  if (units === 0n) return '—';
  const absolute = units < 0n ? -units : units;
  return `${units > 0n ? '+' : '-'}${formatPwrcBaseUnits(absolute.toString())} PWRC`;
}

export default function CreditsScreen() {
  const theme = useAppTheme();
  const { authenticated, pricing, account, ledger, isLoading, isTopUpPolling, error, lastTopUp, refresh, claimDemoGrant, createTopUp } = useCredits();
  const fundingPresets = pricing?.fundingPresets ?? FALLBACK_TOP_UP_PRESETS;
  const fundingHistory = ledger.filter((entry) => entry.type === 'payment_credit' || entry.type === 'demo_grant');
  const lowCredits = account ? BigInt(account.responseCreditsRemaining) <= 10n : false;

  async function startTopUp(amount: bigint) {
    const topUp = await createTopUp(pwrcWholeTokensToBaseUnits(amount));
    if (topUp) await Linking.openURL(topUp.solanaPayUri);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>PWRC Copilot Credits</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Integer accounting for metered Copilot responses.</Text>
          </View>
          <StatusPill label={authenticated ? 'Authenticated' : 'Sign-in required'} tone={authenticated ? 'success' : 'warning'} />
        </View>

        {!authenticated ? (
          <Card>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Authenticated account required</Text>
            <Text style={[styles.body, { color: theme.textMuted }]}>Pricing, balances, ledger history, grants, and top-ups are user-scoped and require a server-issued access token. The client does not create local financial state.</Text>
          </Card>
        ) : null}

        {account ? (
          <Card>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Credit account</Text>
              <Text style={[styles.responses, { color: theme.primary }]}>{account.responseCreditsRemaining} responses</Text>
            </View>
            <View style={styles.balanceGrid}>
              <CreditBalance label="Available" baseUnits={account.availableBaseUnits} emphasized />
              <CreditBalance label="Reserved" baseUnits={account.reservedBaseUnits} />
              <CreditBalance label="Spent" baseUnits={account.spentBaseUnits} />
              <CreditBalance label="Funded" baseUnits={account.fundedBaseUnits} />
            </View>
            <Text style={[styles.micro, { color: theme.textMuted }]}>All API values are decimal strings representing 9-decimal integer PWRC base units.</Text>
          </Card>
        ) : null}

        {lowCredits ? (
          <Card>
            <Text style={[styles.cardTitle, { color: theme.warning }]}>Low PWRC runway</Text>
            <Text style={[styles.body, { color: theme.textMuted }]}>This account has {account?.responseCreditsRemaining ?? '0'} completed responses remaining at the current 10,000 PWRC message-unit price.</Text>
          </Card>
        ) : null}

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Pricing</Text>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>1 completed response</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{pricing?.responseCostPwrc ?? '10,000'} PWRC</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>1 MSG UNIT</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>10,000 PWRC · ≈ ${pricing?.referenceEconomics.responseReferenceValueUsd ?? '0.02'} ref</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Configured reference</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>1 PWRC = ${pricing?.referenceEconomics.referencePriceUsdPerPwrc ?? '0.000002'}</Text>
          </View>
          <Text style={[styles.micro, { color: theme.textMuted }]}>10,000 × $0.000002 = $0.02 configured reference value per completed response.</Text>
          <Text style={[styles.micro, { color: theme.textMuted }]}>$1 reference value = 500,000 PWRC = 50 completed responses. This is configured reference economics, not a live market price.</Text>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Sample credit grant</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{pricing?.demoGrantPwrc ?? '1,000,000'} sample PWRC = {pricing?.demoGrantResponses ?? '100'} responses</Text>
          </View>
          <Text style={[styles.micro, { color: theme.textMuted }]}>Sample PWRC is an internal Copilot accounting credit for evaluation; claiming it does not mint or transfer on-chain PWRC.</Text>
          <PrimaryButton label={isLoading ? 'Working…' : 'Claim 1,000,000 sample PWRC'} onPress={() => void claimDemoGrant()} disabled={!authenticated || isLoading} />
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>PWRC Solana Pay top-up</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>Creating a payment request does not fund credits. The account is credited only after the Payment Kernel authenticates and verifies a canonical <Text style={styles.mono}>payment.settled</Text> event.</Text>
          <View style={styles.presetRow}>
            {fundingPresets.map((preset) => (
              <Pressable
                key={preset.pwrc.toString()}
                accessibilityRole="button"
                disabled={!authenticated || isLoading}
                onPress={() => void startTopUp(BigInt(preset.pwrc))}
                style={({ pressed }) => [styles.preset, { borderColor: pressed ? theme.primary : theme.border, backgroundColor: theme.surfaceMuted }, (!authenticated || isLoading) && styles.disabled]}
              >
                <Text style={[styles.presetText, { color: theme.text }]}>{BigInt(preset.pwrc).toLocaleString()} PWRC · {Number(preset.responses).toLocaleString()} responses · ≈ ${preset.referenceValueUsd} ref</Text>
              </Pressable>
            ))}
          </View>
          {lastTopUp ? (
            <View style={styles.topUpStatus}>
              <StatusPill
                label={lastTopUp.status === 'pending' ? (isTopUpPolling ? 'Verifying settlement' : 'Pending verification') : lastTopUp.status === 'settled' ? 'Verified + credited' : 'Expired'}
                tone={lastTopUp.status === 'settled' ? 'success' : lastTopUp.status === 'expired' ? 'warning' : 'neutral'}
              />
              <Text style={[styles.micro, { color: theme.textMuted }]}>Top-up {lastTopUp.id.slice(0, 8)}… · reference {lastTopUp.reference.slice(0, 10)}…</Text>
              <Text style={[styles.micro, { color: theme.textMuted }]}>The app polls the authenticated server status only. It never increments PWRC credits locally.</Text>
            </View>
          ) : null}
          <PrimaryButton label={isLoading ? 'Refreshing…' : 'Refresh credits'} onPress={() => void refresh()} disabled={!authenticated || isLoading} />
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>PWRC network identity</Text>
          <View style={styles.identityRows}>
            <IdentityRow label="Network" value={PWRC_IDENTITY.networkLabel} />
            <IdentityRow label="Standard" value={PWRC_IDENTITY.standard} />
            <IdentityRow label="Decimals" value={String(PWRC_IDENTITY.decimals)} />
            <IdentityRow label="Mint" value={PWRC_IDENTITY.mint} selectable />
          </View>
          <PrimaryButton label="Open Solana Explorer" onPress={() => void Linking.openURL(PWRC_IDENTITY.explorerUrl)} />
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Funding history</Text>
        {fundingHistory.length ? fundingHistory.slice(0, 5).map((entry) => (
          <Card key={`funding-${entry.id}`} compact>
            <View style={styles.ledgerRow}>
              <View style={styles.ledgerText}>
                <Text style={[styles.ledgerTitle, { color: theme.text }]}>{ledgerLabels[entry.type]}</Text>
                <Text style={[styles.micro, { color: theme.textMuted }]}>{new Date(entry.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={[styles.ledgerAmount, { color: theme.success }]}>{availableDelta(entry)}</Text>
            </View>
          </Card>
        )) : <Card compact><Text style={[styles.body, { color: theme.textMuted }]}>No verified funding entries yet.</Text></Card>}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Credit ledger</Text>
        {ledger.length ? ledger.map((entry) => (
          <Card key={entry.id} compact>
            <View style={styles.ledgerRow}>
              <View style={styles.ledgerText}>
                <Text style={[styles.ledgerTitle, { color: theme.text }]}>{ledgerLabels[entry.type]}</Text>
                <Text style={[styles.micro, { color: theme.textMuted }]}>#{entry.sequence} · {new Date(entry.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={[styles.ledgerAmount, { color: BigInt(entry.availableDeltaBaseUnits) >= 0n ? theme.success : theme.textMuted }]}>{availableDelta(entry)}</Text>
            </View>
          </Card>
        )) : (
          <Card compact>
            <Text style={[styles.body, { color: theme.textMuted }]}>{authenticated ? 'No credit ledger entries returned.' : 'Sign in to load your append-only credit ledger.'}</Text>
          </Card>
        )}

        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

function IdentityRow({ label, value, selectable = false }: { label: string; value: string; selectable?: boolean }) {
  const theme = useAppTheme();
  return (
    <View style={styles.identityRow}>
      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text selectable={selectable} style={[styles.identityValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  header: { gap: spacing.md },
  headerText: { gap: spacing.xs },
  title: { fontSize: typography.title, fontWeight: '800' },
  subtitle: { fontSize: typography.body, lineHeight: 23 },
  cardTitle: { fontSize: typography.body, fontWeight: '800' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  responses: { fontSize: typography.small, fontWeight: '800' },
  body: { fontSize: typography.small, lineHeight: 20 },
  micro: { fontSize: typography.micro, lineHeight: 16 },
  mono: { fontFamily: 'monospace' },
  balanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.lg },
  metricLabel: { flexShrink: 0, fontSize: typography.small, fontWeight: '700' },
  metricValue: { flex: 1, textAlign: 'right', fontSize: typography.small, fontWeight: '800' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  topUpStatus: { gap: spacing.xs, alignItems: 'flex-start' },
  preset: { minHeight: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  presetText: { fontSize: typography.small, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  identityRows: { gap: spacing.sm },
  identityRow: { gap: spacing.xs },
  identityValue: { fontSize: typography.small, lineHeight: 19, fontWeight: '700' },
  sectionTitle: { marginTop: spacing.sm, fontSize: typography.heading, fontWeight: '800' },
  ledgerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  ledgerText: { flex: 1, gap: spacing.xs },
  ledgerTitle: { fontSize: typography.small, fontWeight: '800' },
  ledgerAmount: { fontSize: typography.small, fontWeight: '800', textAlign: 'right' },
  error: { fontSize: typography.small, lineHeight: 19 },
});
