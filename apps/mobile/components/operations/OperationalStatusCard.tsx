import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { StatusPill } from '@/components/common/StatusPill';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { OperationalStatus, SourceMetadata } from '@/types/operations';
import { SourceBadge } from './SourceBadge';

type Props = {
  title: string;
  subtitle?: string;
  status: OperationalStatus;
  source?: SourceMetadata;
  children?: React.ReactNode;
};

function tone(status: OperationalStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'operational') return 'success';
  if (status === 'degraded') return 'warning';
  if (status === 'offline') return 'danger';
  return 'neutral';
}

export function OperationalStatusCard({ title, subtitle, status, source, children }: Props) {
  const theme = useAppTheme();
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text> : null}
        </View>
        <StatusPill label={status.replace('_', ' ')} tone={tone(status)} />
      </View>
      {children}
      {source ? <SourceBadge source={source} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', justifyContent: 'space-between' },
  titleBlock: { flex: 1, gap: spacing.xs },
  title: { fontSize: typography.heading, fontWeight: '700' },
  subtitle: { fontSize: typography.small, lineHeight: 18 },
});
