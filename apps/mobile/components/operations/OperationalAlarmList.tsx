import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/common/Card';
import { StatusPill } from '@/components/common/StatusPill';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { OperationalAlarm } from '@/types/operations';
import { SourceBadge } from './SourceBadge';

function tone(severity: OperationalAlarm['severity']): 'danger' | 'warning' | 'neutral' {
  return severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'neutral';
}

export function OperationalAlarmList({ alarms, limit = 5 }: { alarms: OperationalAlarm[]; limit?: number }) {
  const theme = useAppTheme();
  if (!alarms.length) return <Card><Text style={[styles.empty, { color: theme.textMuted }]}>No alarms in this view.</Text></Card>;
  return (
    <View style={styles.list}>
      {alarms.slice(0, limit).map((alarm) => (
        <Card key={alarm.id}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={[styles.title, { color: theme.text }]}>{alarm.title}</Text>
              <Text style={[styles.code, { color: theme.textMuted }]}>{alarm.code}</Text>
            </View>
            <StatusPill label={alarm.severity} tone={tone(alarm.severity)} />
          </View>
          {alarm.detail ? <Text style={[styles.detail, { color: theme.textMuted }]}>{alarm.detail}</Text> : null}
          <SourceBadge source={alarm.source} />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  header: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'flex-start' },
  heading: { flex: 1, gap: 2 },
  title: { fontSize: typography.body, fontWeight: '700' },
  code: { fontSize: typography.micro, fontWeight: '600' },
  detail: { fontSize: typography.small, lineHeight: 18 },
  empty: { fontSize: typography.small },
});
