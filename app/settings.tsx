import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { notifySelection } from '@/services/feedback';
import { colors } from '@/theme/colors';
import { fontSizes, radii, spacing } from '@/theme/spacing';

export default function SettingsScreen() {
  const [celebrations, setCelebrations] = useState(true);
  const [weeklyRecap, setWeeklyRecap] = useState(true);

  return (
    <Screen>
      <View style={styles.heroIcon}>
        <Text accessibilityElementsHidden style={styles.heroEmoji}>🐷</Text>
      </View>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>A few simple ways to make Piggi feel like yours.</Text>

      <Text style={styles.sectionLabel}>EXPERIENCE</Text>
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

      <Text style={styles.sectionLabel}>ABOUT PIGGI</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data source</Text>
          <Text style={styles.infoValue}>Local demo</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.safetyNote}>
        <Ionicons color={colors.safe} name="shield-checkmark-outline" size={22} />
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
  const handleValueChange = (nextValue: boolean) => {
    notifySelection();
    onValueChange(nextValue);
  };

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons color={colors.primary} name={icon} size={20} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        onValueChange={handleValueChange}
        thumbColor={colors.white}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heroIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
  heroEmoji: { fontSize: 34 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.7, marginTop: spacing.md },
  subtitle: { color: colors.muted, fontSize: fontSizes.body, lineHeight: 22, marginTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden', paddingHorizontal: spacing.md },
  settingRow: { alignItems: 'center', flexDirection: 'row', minHeight: 72 },
  settingIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  settingLabel: { color: colors.ink, flex: 1, fontSize: fontSizes.body, fontWeight: '700', marginLeft: spacing.md },
  divider: { backgroundColor: colors.border, height: 1 },
  sectionLabel: { color: colors.primary, fontSize: fontSizes.caption, fontWeight: '900', letterSpacing: 1.1, marginBottom: spacing.sm, marginTop: spacing.xl },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 56 },
  infoLabel: { color: colors.ink, fontSize: fontSizes.body, fontWeight: '600' },
  infoValue: { color: colors.muted, fontSize: 14 },
  safetyNote: { alignItems: 'center', backgroundColor: colors.safeSoft, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md },
  safetyText: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 18 },
});
