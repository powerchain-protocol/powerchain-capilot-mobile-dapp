import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  AppState,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AssetIcon } from "../../src/components/web3";
import { ResponsiveGrid } from "../../src/components/layout";
import {
  Button,
  Card,
  Screen,
  Section,
  StatusBadge,
} from "../../src/components/ui";
import {
  claimPwrcDemoGrant,
  createPwrcTopup,
  formatPwrcTokens,
  shortHash,
  getPwrcCreditReconciliation,
  getPwrcFunding,
  getPwrcLedger,
  getPwrcTopups,
  type PwrcCreditReconciliation,
  type PwrcFunding,
  type PwrcLedgerEntry,
  type PwrcTopupIntent,
  usePwrcCredits,
} from "../../src/features/credits";
import { usePowerChainTheme } from "../../src/theme";

function topupTone(status: PwrcTopupIntent["status"]) {
  if (status === "SETTLED") return "success" as const;
  if (status === "PENDING") return "info" as const;
  if (status === "EXPIRED") return "warning" as const;
  return "neutral" as const;
}

export default function CopilotCreditsScreen() {
  const { theme } = usePowerChainTheme();
  const credits = usePwrcCredits();
  const [ledger, setLedger] = useState<PwrcLedgerEntry[]>([]);
  const [funding, setFunding] = useState<PwrcFunding[]>([]);
  const [topups, setTopups] = useState<PwrcTopupIntent[]>([]);
  const [reconciliation, setReconciliation] =
    useState<PwrcCreditReconciliation | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await credits.refresh();
      const [ledgerResult, fundingResult, topupResult, reconciliationResult] =
        await Promise.all([
          getPwrcLedger(),
          getPwrcFunding(),
          getPwrcTopups(),
          getPwrcCreditReconciliation(),
        ]);
      setLedger(ledgerResult.items);
      setFunding(fundingResult.items);
      setTopups(topupResult.items);
      setReconciliation(reconciliationResult);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refresh().catch(() => {});

    const subscription = AppState.addEventListener("change", (state) => {
      // Returning from a wallet / Solana Pay flow is a natural settlement
      // refresh point. This endpoint does not consume Copilot credits.
      if (state === "active") void refresh().catch(() => {});
    });

    return () => subscription.remove();
  }, []);

  async function topup(responses: 50 | 250 | 500 | 1000) {
    setBusy(true);
    try {
      const intent = await createPwrcTopup(responses);
      setTopups((current) => [
        intent,
        ...current.filter((item) => item.id !== intent.id),
      ]);
      if (intent.solanaPayUrl) {
        await Linking.openURL(intent.solanaPayUrl);
      }
    } finally {
      setBusy(false);
    }
  }

  async function demoGrant() {
    setBusy(true);
    try {
      const result = await claimPwrcDemoGrant();
      credits.replaceAccount(result.account);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const pricing = credits.pricing;
  const account = credits.account;
  const pendingTopups = topups.filter((item) => item.status === "PENDING");

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.header}>
          <Button
            label="Back"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: theme.colors.text }]}>PWRC Copilot Credits</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>1 completed response = 1 MSG UNIT = 10,000 PWRC</Text>
          </View>
          <Button
            label={refreshing ? "Refreshing…" : "Refresh"}
            variant="secondary"
            size="sm"
            disabled={refreshing}
            onPress={refresh}
          />
        </View>

        {account?.lowCredit ? (
          <Card padding="compact">
            <StatusBadge label="Low credits" tone="warning" />
            <Text style={[styles.warning, { color: theme.colors.text }]}>Only {account.responseRunway} completed Copilot responses remain.</Text>
          </Card>
        ) : null}

        <ResponsiveGrid minItemWidth={260} gap={12}>
          <Card>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Available</Text>
            <Text style={[styles.balance, { color: theme.colors.text }]}>{account?.availablePwrc ?? "0"} PWRC</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{account?.responseRunway ?? 0} completed responses remaining</Text>
          </Card>
          <Card>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Reserved</Text>
            <Text style={[styles.balance, { color: theme.colors.text }]}>{account?.reservedPwrc ?? "0"} PWRC</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Held while generation or delivery acknowledgement is in-flight</Text>
          </Card>
          <Card>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Spent</Text>
            <Text style={[styles.balance, { color: theme.colors.text }]}>{account?.spentPwrc ?? "0"} PWRC</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Settled completed-response credits</Text>
          </Card>
          <Card>
            <Text style={[styles.label, { color: theme.colors.textMuted }]}>Funded</Text>
            <Text style={[styles.balance, { color: theme.colors.text }]}>{account?.fundedPwrc ?? "0"} PWRC</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Lifetime credits funded or granted</Text>
          </Card>
        </ResponsiveGrid>

        {credits.error ? (
          <Section title="Credit service status">
            <Card padding="compact">
              <View style={styles.integrityHeader}>
                <StatusBadge label={credits.stale ? "Stale data" : "Unavailable"} tone="warning" />
                <Button label="Retry" variant="secondary" size="sm" onPress={() => void refresh().catch(() => {})} />
              </View>
              <Text style={[styles.note, { color: theme.colors.textMuted }]}>{credits.error}</Text>
              {credits.lastUpdatedAt ? (
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Last successful refresh {new Date(credits.lastUpdatedAt).toLocaleTimeString()}</Text>
              ) : null}
            </Card>
          </Section>
        ) : null}

        <Section title="Account integrity" description="Ledger and reservation reconciliation">
          <Card padding="compact">
            <View style={styles.integrityHeader}>
              <StatusBadge
                label={reconciliation?.status === "balanced" ? "Balanced" : "Needs review"}
                tone={reconciliation?.status === "balanced" ? "success" : "warning"}
              />
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                {reconciliation
                  ? `${reconciliation.activeReservations} active reservation${reconciliation.activeReservations === 1 ? "" : "s"}`
                  : "Checking…"}
              </Text>
            </View>
            <Text style={[styles.note, { color: theme.colors.textMuted }]}>
              Funded must equal available + reserved + spent, and active reservation totals must equal the reserved balance.
            </Text>
            {reconciliation ? (
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                {Object.values(reconciliation.checks).filter(Boolean).length} / {Object.keys(reconciliation.checks).length} accounting controls passing · {reconciliation.receiptCount} settled message receipt{reconciliation.receiptCount === 1 ? "" : "s"}
              </Text>
            ) : null}
          </Card>
        </Section>

        <Section title="Pricing formula">
          <Card>
            <Text style={[styles.formula, { color: theme.colors.text }]}>1 PWRC = $0.000002 reference value</Text>
            <Text style={[styles.formula, { color: theme.colors.text }]}>10,000 PWRC × $0.000002 = $0.02 / completed response</Text>
            <Text style={[styles.formula, { color: theme.colors.text }]}>$1 reference value = 500,000 PWRC = 50 responses</Text>
            <Text style={[styles.note, { color: theme.colors.textMuted }]}>Reference economics only. The $0.000002 value is not a live market price.</Text>
            {credits.quote ? (
              <Text style={[styles.note, { color: theme.colors.textMuted }]}>
                Deterministic quote {shortHash(credits.quote.quoteHash)} · {credits.quote.costBaseUnits} base units
              </Text>
            ) : null}
          </Card>
        </Section>

        <Section title="Fund Copilot credits" description="Message-denominated PWRC presets">
          <ResponsiveGrid minItemWidth={220} gap={8} maxColumns={4}>
            {(pricing?.presets ?? []).map((preset) => (
              <Card key={preset.responses} padding="compact">
                <Text style={[styles.preset, { color: theme.colors.text }]}>{formatPwrcTokens(preset.pwrc)} PWRC</Text>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{preset.responses.toLocaleString()} responses</Text>
                <View style={{ marginTop: 10 }}>
                  <Button
                    label={pricing?.topupsEnabled ? "Fund with Solana Pay" : "Top-ups unavailable"}
                    size="sm"
                    fullWidth
                    disabled={!pricing?.topupsEnabled || busy}
                    onPress={() => topup(preset.responses)}
                  />
                </View>
              </Card>
            ))}
          </ResponsiveGrid>
          {pricing?.demoGrantEnabled ? (
            <View style={{ marginTop: 10, maxWidth: 360 }}>
              <Button
                label="Claim 1,000,000 sample PWRC · 100 responses"
                variant="secondary"
                fullWidth
                disabled={busy}
                onPress={demoGrant}
              />
            </View>
          ) : null}
        </Section>

        {pendingTopups.length ? (
          <Section title="Pending funding" description="Credits appear only after Payment Kernel verification">
            <Card padding="compact">
              {pendingTopups.slice(0, 5).map((item) => (
                <View key={item.id} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.rowStatus}>
                      <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{formatPwrcTokens(item.amountPwrc)} PWRC</Text>
                      <StatusBadge label={item.status} tone={topupTone(item.status)} />
                    </View>
                    <Text numberOfLines={1} style={[styles.meta, { color: theme.colors.textMuted }]}>{item.responses.toLocaleString()} responses · expires {new Date(item.expiresAt).toLocaleTimeString()}</Text>
                  </View>
                  {item.solanaPayUrl ? (
                    <Button label="Open" variant="secondary" size="sm" onPress={() => Linking.openURL(item.solanaPayUrl!)} />
                  ) : null}
                </View>
              ))}
            </Card>
          </Section>
        ) : null}

        <Section title="PWRC token">
          <Card>
            <View style={styles.tokenRow}>
              <AssetIcon symbol="PWRC" size={42} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.tokenTitle, { color: theme.colors.text }]}>PowerChain · PWRC</Text>
                <Text selectable style={[styles.address, { color: theme.colors.textMuted }]}>{pricing?.token.mint ?? "—"}</Text>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{pricing?.token.network ?? "—"} · Token-2022 · 9 decimals</Text>
              </View>
            </View>
            {pricing?.token.explorerUrl ? (
              <View style={{ marginTop: 10, maxWidth: 220 }}>
                <Button label="Open Solana Explorer" variant="secondary" size="sm" onPress={() => Linking.openURL(pricing.token.explorerUrl)} />
              </View>
            ) : null}
          </Card>
        </Section>

        <Section title="Funding history">
          <Card padding="compact">
            {funding.length ? funding.slice(0, 10).map((item) => (
              <View key={item.id} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{formatPwrcTokens(item.amountPwrc)} PWRC settled</Text>
                  <Text numberOfLines={1} style={[styles.meta, { color: theme.colors.textMuted }]}>{item.transactionSignature ?? item.paymentSettlementId}</Text>
                </View>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            )) : <Text style={[styles.note, { color: theme.colors.textMuted }]}>No settled PWRC funding yet.</Text>}
          </Card>
        </Section>

        <Section title="Credit ledger">
          <Card padding="compact">
            {ledger.length ? ledger.slice(0, 20).map((entry) => (
              <View key={entry.id} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{entry.entryType.replaceAll("_", " ")}</Text>
                  <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{entry.description}</Text>
                </View>
                <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{new Date(entry.createdAt).toLocaleDateString()}</Text>
              </View>
            )) : <Text style={[styles.note, { color: theme.colors.textMuted }]}>No PWRC credit activity yet.</Text>}
          </Card>
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 16, paddingBottom: 30, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 21, lineHeight: 27, fontWeight: "700" },
  subtitle: { marginTop: 2, fontSize: 12, lineHeight: 17 },
  label: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
  balance: { marginTop: 4, fontSize: 22, lineHeight: 28, fontWeight: "700" },
  meta: { fontSize: 11, lineHeight: 15 },
  warning: { marginTop: 8, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  formula: { fontSize: 14, lineHeight: 21, fontWeight: "600", marginBottom: 5 },
  note: { marginTop: 8, fontSize: 12, lineHeight: 18 },
  preset: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  tokenRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  tokenTitle: { fontSize: 15, lineHeight: 21, fontWeight: "700" },
  address: { marginTop: 3, fontSize: 10, lineHeight: 14 },
  integrityHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rowStatus: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  rowTitle: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
});
