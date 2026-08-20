import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { notifySelection } from '@/services/feedback';

type DatePickerFieldProps = {
  minimumDate: string;
  onChange: (isoDate: string) => void;
  value: string;
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DATE_PRESETS = [
  { days: 7, label: '1 week' },
  { days: 30, label: '1 month' },
  { days: 90, label: '3 months' },
] as const;

export function DatePickerField({ minimumDate, onChange, value }: DatePickerFieldProps) {
  const minimum = fromIsoDate(minimumDate);
  const selected = value ? fromIsoDate(value) : null;
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selected ?? minimum));

  const days = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const previousMonth = addMonths(visibleMonth, -1);
  const previousDisabled = previousMonth < startOfMonth(minimum);
  const presetDates = DATE_PRESETS.map((preset) => ({
    ...preset,
    date: addDays(minimum, preset.days - 1),
  }));

  const openCalendar = () => {
    setVisibleMonth(startOfMonth(selected ?? minimum));
    setIsOpen(true);
  };

  const chooseDate = (date: Date) => {
    notifySelection();
    onChange(toIsoDate(date));
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityLabel="Choose unlock date"
        accessibilityRole="button"
        onPress={openCalendar}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Ionicons color={colors.muted} name="calendar-outline" size={20} />
        <Text style={[styles.fieldValue, !selected && styles.placeholder]}>
          {selected ? formatLongDate(selected) : 'Select an unlock date'}
        </Text>
        <Ionicons color={colors.placeholder} name="chevron-down" size={18} />
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Close date selector"
            accessibilityRole="button"
            onPress={() => setIsOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView accessibilityViewIsModal edges={['bottom']} style={styles.calendarCard}>
            <View style={styles.grabber} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>UNLOCK DATE</Text>
                <Text style={styles.modalTitle}>Choose a day</Text>
              </View>
              <Pressable
                accessibilityLabel="Close date selector"
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons color={colors.ink} name="close" size={21} />
              </Pressable>
            </View>

            <View style={styles.presets}>
              {presetDates.map((preset) => {
                const isSelected = value === toIsoDate(preset.date);
                return (
                  <Pressable
                    accessibilityLabel={`Unlock in ${preset.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={preset.label}
                    onPress={() => chooseDate(preset.date)}
                    style={({ pressed }) => [
                      styles.presetButton,
                      isSelected && styles.presetSelected,
                      pressed && styles.dayPressed,
                    ]}
                  >
                    <Text style={[styles.presetText, isSelected && styles.presetSelectedText]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.monthHeader}>
              <Pressable
                accessibilityLabel="Previous month"
                disabled={previousDisabled}
                onPress={() => setVisibleMonth(previousMonth)}
                style={[styles.monthButton, previousDisabled && styles.monthButtonDisabled]}
              >
                <Ionicons color={colors.ink} name="chevron-back" size={20} />
              </Pressable>
              <Text style={styles.monthLabel}>{formatMonth(visibleMonth)}</Text>
              <Pressable
                accessibilityLabel="Next month"
                onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                style={styles.monthButton}
              >
                <Ionicons color={colors.ink} name="chevron-forward" size={20} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((date, index) => {
                if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;

                const isoDate = toIsoDate(date);
                const disabled = date < minimum;
                const isSelected = value === isoDate;

                return (
                  <View key={isoDate} style={styles.dayCell}>
                    <Pressable
                      accessibilityLabel={formatLongDate(date)}
                      accessibilityRole="button"
                      accessibilityState={{ disabled, selected: isSelected }}
                      disabled={disabled}
                      onPress={() => chooseDate(date)}
                      style={({ pressed }) => [
                        styles.dayButton,
                        isSelected && styles.daySelected,
                        pressed && !disabled && styles.dayPressed,
                      ]}
                    >
                      <Text style={[
                        styles.dayText,
                        disabled && styles.dayDisabled,
                        isSelected && styles.daySelectedText,
                      ]}>
                        {date.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.calendarFooter}>
              <Ionicons color={colors.primary} name="lock-closed-outline" size={17} />
              <Text style={styles.footerText}>Past dates can’t be selected.</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

export function getTomorrowIsoDate() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return toIsoDate(date);
}

function getCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1, 12).getDay();
  const dayCount = new Date(year, monthIndex + 1, 0, 12).getDate();
  const cells: Array<Date | null> = Array(firstWeekday).fill(null);

  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(new Date(year, monthIndex, day, 12));
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

const styles = StyleSheet.create({
  field: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, minHeight: 54, paddingHorizontal: spacing.md },
  pressed: { opacity: 0.72 },
  fieldValue: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '600' },
  placeholder: { color: colors.placeholder, fontWeight: '400' },
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(12, 22, 17, 0.58)', flex: 1, justifyContent: 'flex-end' },
  calendarCard: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxWidth: 480, padding: spacing.lg, paddingTop: spacing.sm, width: '100%' },
  grabber: { alignSelf: 'center', backgroundColor: '#C9C7C0', borderRadius: 999, height: 5, marginBottom: spacing.md, width: 42 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  modalTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 2 },
  closeButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  presets: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  presetButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 42, paddingHorizontal: spacing.sm },
  presetSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  presetSelectedText: { color: colors.white },
  monthHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.lg },
  monthButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  monthButtonDisabled: { opacity: 0.28 },
  monthLabel: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  weekRow: { flexDirection: 'row', marginBottom: 5 },
  weekday: { color: colors.muted, fontSize: 11, fontWeight: '800', textAlign: 'center', width: '14.2857%' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { alignItems: 'center', height: 43, justifyContent: 'center', width: '14.2857%' },
  dayButton: { alignItems: 'center', borderRadius: 20, height: 38, justifyContent: 'center', width: 38 },
  dayPressed: { backgroundColor: colors.primarySoft },
  daySelected: { backgroundColor: colors.primary },
  dayText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  dayDisabled: { color: '#C5C5C0' },
  daySelectedText: { color: colors.white },
  calendarFooter: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 13, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: 12 },
  footerText: { color: colors.muted, fontSize: 12 },
});
