import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { Screen } from '@/components/common/Screen';
import { spacing, typography } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalRole } from '@/context/RoleContext';
import { useThemePreference } from '@/context/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { OPERATIONAL_ROLES } from '@/types/roles';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { session } = useAuthSession();
  const { role, availableRoles, setRole } = useOperationalRole();
  const { preference, setPreference } = useThemePreference();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Profile & Controls</Text>
        <Text style={[styles.body, { color: theme.textMuted }]}>User-scoped role, theme, credits and diagnostics controls.</Text>
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Session</Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>{session ? `Authenticated · ${session.userId}` : 'Not authenticated'}</Text>
        </Card>
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Operational role</Text>
          <View style={styles.pills}>
            {OPERATIONAL_ROLES.filter((item) => availableRoles.includes(item.id)).map((item) => (
              <Pressable key={item.id} onPress={() => setRole(item.id)} style={[styles.pill, { borderColor: role === item.id ? theme.primary : theme.border, backgroundColor: role === item.id ? theme.surfaceMuted : theme.surface }]}>
                <Text style={{ color: role === item.id ? theme.primary : theme.textMuted, fontWeight: '700' }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Appearance</Text>
          <View style={styles.pills}>
            {(['system', 'light', 'carbon-dark'] as const).map((item) => (
              <Pressable key={item} onPress={() => setPreference(item)} style={[styles.pill, { borderColor: preference === item ? theme.primary : theme.border }]}>
                <Text style={{ color: preference === item ? theme.primary : theme.textMuted, fontWeight: '700' }}>{item === 'carbon-dark' ? 'Carbon Dark' : item[0].toUpperCase() + item.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Account & diagnostics</Text>
          <Pressable onPress={() => router.push('/credits')} style={styles.link}><Text style={[styles.linkText, { color: theme.primary }]}>PWRC Credits</Text></Pressable>
          <Pressable onPress={() => router.push('/diagnostics')} style={styles.link}><Text style={[styles.linkText, { color: theme.primary }]}>Service Health / Diagnostics</Text></Pressable>
          <Pressable onPress={() => router.push('/prompts')} style={styles.link}><Text style={[styles.linkText, { color: theme.primary }]}>Prompt Library</Text></Pressable>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  title: { fontSize: typography.title, fontWeight: '800' },
  body: { fontSize: typography.body, lineHeight: 23 },
  cardTitle: { fontSize: typography.body, fontWeight: '800' },
  meta: { fontSize: typography.small, lineHeight: 18 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  link: { paddingVertical: spacing.sm },
  linkText: { fontSize: typography.body, fontWeight: '700' },
});
