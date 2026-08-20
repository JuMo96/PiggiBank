import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function SettingsScreen() {
  const [celebrations, setCelebrations] = useState(true);
  const [weeklyRecap, setWeeklyRecap] = useState(true);

  return (
    <Screen>
      <Text style={styles.title}>Make Piggi yours</Text>
      <Text style={styles.subtitle}>These preferences are stored locally for this demo session.</Text>

      <View style={styles.card}>
        <SettingRow
          icon="sparkles-outline"
          label="Goal celebrations"
          onValueChange={setCelebrations}
          value={celebrations}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="calendar-outline"
          label="Weekly recap"
          onValueChange={setWeeklyRecap}
          value={weeklyRecap}
        />
      </View>

      <Text style={styles.sectionLabel}>ABOUT</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data source</Text>
          <Text style={styles.infoValue}>Mock data</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.safetyNote}>
        <Ionicons color={colors.muted} name="shield-checkmark-outline" size={22} />
        <Text style={styles.safetyText}>No bank accounts, payment providers, or real funds are connected.</Text>
      </View>
    </Screen>
  );
}

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
};

function SettingRow({ icon, label, onValueChange, value }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons color={colors.primary} name={icon} size={20} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        onValueChange={onValueChange}
        thumbColor={colors.white}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: spacing.xl, marginTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, overflow: 'hidden', paddingHorizontal: spacing.md },
  settingRow: { alignItems: 'center', flexDirection: 'row', minHeight: 68 },
  settingIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  settingLabel: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '700', marginLeft: spacing.md },
  divider: { backgroundColor: colors.border, height: 1 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: spacing.sm, marginTop: spacing.xl },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 56 },
  infoLabel: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  infoValue: { color: colors.muted, fontSize: 14 },
  safetyNote: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, paddingHorizontal: spacing.sm },
  safetyText: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 18 },
});
