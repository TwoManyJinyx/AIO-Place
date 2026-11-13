import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppData } from '@/components/app-data';
import { ActionButton, AppLoading, AppStorageError, Card, EmptyState, Page, PageHeader, palette } from '@/components/app-ui';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function displayTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export default function ScheduleScreen() {
  const { schedule, goals, addScheduleItem, toggleScheduleItem, updateGoalDeadline, ready, storageError, retryStorage } = useAppData();
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [linkedGoal, setLinkedGoal] = useState('');
  const [error, setError] = useState('');

  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1 - firstWeekday);
    return Array.from({ length: 42 }, (_, index) =>
      new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() + index),
    );
  }, [month]);

  const selectedItems = schedule
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));
  const selectedDateText = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (storageError) return <AppStorageError message={storageError} onRetry={retryStorage} />;
  if (!ready) return <AppLoading />;

  function moveMonth(amount: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function closeModal() {
    setModalVisible(false);
    setTitle('');
    setTime('09:00');
    setLinkedGoal('');
    setError('');
  }

  function saveItem() {
    if (!isValidTime(time)) {
      setError('Enter a valid time in 24-hour format, like 09:30.');
      return;
    }
    if (linkedGoal) {
      const goal = goals.find((item) => item.id === linkedGoal);
      if (!goal || !isValidDateKey(selectedDate)) {
        setError('Choose a valid date for this fund deadline.');
        return;
      }
      updateGoalDeadline(goal.id, selectedDate, time);
    } else {
      if (!title.trim()) {
        setError('Give your event a name.');
        return;
      }
      addScheduleItem({
        title: title.trim(),
        date: selectedDate,
        time,
        type: 'event',
      });
    }
    closeModal();
  }

  return (
    <Page>
      <PageHeader
        eyebrow="YOUR SCHEDULE"
        title="Make time for what matters."
        subtitle="A clear view of your week, your plans, and the goals you’re working toward." />

      <View style={styles.layout}>
        <Card style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <View>
              <Text style={styles.calendarEyebrow}>YOUR CALENDAR</Text>
              <Text style={styles.monthTitle}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={styles.monthControls}>
              <Pressable onPress={() => moveMonth(-1)} style={styles.monthButton} accessibilityLabel="Previous month"><Text style={styles.monthArrow}>‹</Text></Pressable>
              <Pressable onPress={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(dateKey(today)); }} style={styles.todayButton}><Text style={styles.todayText}>Today</Text></Pressable>
              <Pressable onPress={() => moveMonth(1)} style={styles.monthButton} accessibilityLabel="Next month"><Text style={styles.monthArrow}>›</Text></Pressable>
            </View>
          </View>
          <View style={styles.weekHeader}>
            {weekdays.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
          </View>
          <View style={styles.calendarGrid}>
            {calendarDays.map((date) => {
              const key = dateKey(date);
              const inMonth = date.getMonth() === month.getMonth();
              const isSelected = selectedDate === key;
              const isToday = dateKey(today) === key;
              const markers = schedule.filter((item) => item.date === key);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${date.toLocaleDateString()}, ${markers.length} events`}
                  key={key}
                  onPress={() => setSelectedDate(key)}
                  style={[styles.dayCell, isSelected && styles.selectedDay]}>
                  <Text style={[styles.dayNumber, !inMonth && styles.outsideMonth, isToday && styles.todayNumber, isSelected && styles.selectedNumber]}>{date.getDate()}</Text>
                  <View style={styles.markers}>
                    {markers.slice(0, 3).map((item) => (
                      <View key={item.id} style={[styles.marker, { backgroundColor: item.type === 'deadline' ? palette.orange : palette.green }]} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: palette.green }]} /><Text style={styles.legendText}>Event</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: palette.orange }]} /><Text style={styles.legendText}>Fund deadline</Text></View>
          </View>
        </Card>

        <Card style={styles.agendaCard}>
          <View style={styles.agendaHeader}>
            <View>
              <Text style={styles.calendarEyebrow}>YOUR AGENDA</Text>
              <Text style={styles.agendaDate}>{selectedDateText}</Text>
            </View>
            <Pressable onPress={() => setModalVisible(true)} style={styles.addButton}><Text style={styles.addButtonText}>＋</Text></Pressable>
          </View>
          {selectedItems.length ? (
            <View style={styles.eventList}>
              {selectedItems.map((item) => (
                <Pressable key={item.id} onPress={() => toggleScheduleItem(item.id)} style={styles.eventItem}>
                  <View style={[styles.eventRail, { backgroundColor: item.type === 'deadline' ? palette.orange : palette.green }]} />
                  <View style={styles.eventContent}>
                    <Text style={[styles.eventTime, item.done && styles.doneText]}>{item.type === 'deadline' ? 'FUND DEADLINE' : displayTime(item.time)}</Text>
                    <Text style={[styles.eventTitle, item.done && styles.doneText]}>{item.title}</Text>
                    {item.type === 'deadline' ? <Text style={styles.eventHint}>Tap to {item.done ? 'reopen' : 'mark complete'}</Text> : null}
                  </View>
                  <View style={[styles.eventCheck, item.done && styles.eventCheckDone]}>{item.done ? <Text style={styles.eventCheckmark}>✓</Text> : null}</View>
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyState title="Nothing planned yet" body="Enjoy the breathing room, or add something to this day." />
          )}
          <ActionButton label="Add to this day  ＋" secondary onPress={() => setModalVisible(true)} />
        </Card>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View><Text style={styles.calendarEyebrow}>ADD TO YOUR AGENDA</Text><Text style={styles.modalTitle}>{selectedDateText}</Text></View>
              <Pressable onPress={closeModal} accessibilityLabel="Close"><Text style={styles.close}>×</Text></Pressable>
            </View>
            <Text style={styles.fieldLabel}>Link a fund deadline <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.goalOptions}>
              <Pressable onPress={() => setLinkedGoal('')} style={[styles.goalOption, !linkedGoal && styles.selectedOption]}><Text style={[styles.goalOptionText, !linkedGoal && styles.selectedOptionText]}>No fund</Text></Pressable>
              {goals.map((goal) => (
                <Pressable key={goal.id} onPress={() => setLinkedGoal(goal.id)} style={[styles.goalOption, linkedGoal === goal.id && styles.selectedOption]}>
                  <Text style={[styles.goalOptionText, linkedGoal === goal.id && styles.selectedOptionText]}>{goal.name}</Text>
                </Pressable>
              ))}
            </View>
            {!linkedGoal ? (
              <>
                <Text style={styles.fieldLabel}>What’s on your mind?</Text>
                <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Review monthly budget" placeholderTextColor="#A0AAA4" style={styles.input} maxLength={70} />
              </>
            ) : (
              <Text style={styles.deadlineNote}>This date will become the selected fund’s deadline and appear on your calendar.</Text>
            )}
            <Text style={styles.fieldLabel}>Time <Text style={styles.optional}>(24-hour time)</Text></Text>
            <TextInput value={time} onChangeText={setTime} placeholder="09:00" style={styles.input} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <ActionButton label={linkedGoal ? 'Set fund deadline' : 'Add event'} onPress={saveItem} />
          </View>
        </View>
      </Modal>
    </Page>
  );
}

const styles = StyleSheet.create({
  layout: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 },
  calendarCard: { flexGrow: 1.5, flexBasis: 440, minWidth: 0 },
  agendaCard: { flexGrow: 1, flexBasis: 280, minWidth: 0 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  calendarEyebrow: { color: palette.green, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  monthTitle: { color: palette.ink, fontSize: 21, fontWeight: '700', marginTop: 4 },
  monthControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F4F6F3', alignItems: 'center', justifyContent: 'center' },
  monthArrow: { color: palette.ink, fontSize: 23, lineHeight: 26 },
  todayButton: { paddingHorizontal: 11, height: 34, justifyContent: 'center', backgroundColor: palette.paleGreen, borderRadius: 10 },
  todayText: { color: palette.green, fontSize: 11, fontWeight: '700' },
  weekHeader: { flexDirection: 'row', marginTop: 22, marginBottom: 8 },
  weekday: { width: '14.2857%', textAlign: 'center', color: palette.muted, fontSize: 11, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', minHeight: 56, alignItems: 'center', paddingTop: 7, borderRadius: 12 },
  selectedDay: { backgroundColor: '#E8F0EC' },
  dayNumber: { color: palette.ink, fontSize: 13, fontWeight: '600', width: 27, height: 27, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', borderRadius: 14 },
  outsideMonth: { color: '#B9C1BC' },
  todayNumber: { color: palette.white, backgroundColor: palette.green, overflow: 'hidden' },
  selectedNumber: { color: palette.green, backgroundColor: 'transparent' },
  markers: { minHeight: 7, flexDirection: 'row', justifyContent: 'center', gap: 3, marginTop: 3 },
  marker: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', gap: 18, marginTop: 12, paddingTop: 14, borderTopWidth: 1, borderTopColor: palette.line },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: palette.muted, fontSize: 11 },
  agendaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  agendaDate: { color: palette.ink, fontSize: 17, fontWeight: '700', marginTop: 5, maxWidth: 230 },
  addButton: { width: 36, height: 36, borderRadius: 11, backgroundColor: palette.green, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: palette.white, fontSize: 21, lineHeight: 24 },
  eventList: { gap: 4 },
  eventItem: { flexDirection: 'row', alignItems: 'stretch', gap: 11, paddingVertical: 9, minHeight: 58 },
  eventRail: { width: 3, borderRadius: 4 },
  eventContent: { flex: 1, gap: 4, paddingVertical: 2 },
  eventTime: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  eventTitle: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  eventHint: { color: palette.muted, fontSize: 10 },
  doneText: { color: '#A3ADA7', textDecorationLine: 'line-through' },
  eventCheck: { width: 18, height: 18, borderRadius: 7, borderWidth: 1.5, borderColor: '#CED6D1', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  eventCheckDone: { backgroundColor: palette.green, borderColor: palette.green },
  eventCheckmark: { color: palette.white, fontSize: 11, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(27, 40, 35, .45)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 450, backgroundColor: palette.white, borderRadius: 22, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { color: palette.ink, fontSize: 19, fontWeight: '700', marginTop: 5 },
  close: { color: palette.muted, fontSize: 28, lineHeight: 28 },
  fieldLabel: { color: palette.ink, fontSize: 12, fontWeight: '700', marginTop: 2 },
  optional: { color: palette.muted, fontWeight: '400' },
  input: { height: 46, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FBFCFA', borderRadius: 11, paddingHorizontal: 13, color: palette.ink, fontSize: 14 },
  goalOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  goalOption: { backgroundColor: '#F4F6F3', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  selectedOption: { backgroundColor: palette.paleGreen },
  goalOptionText: { color: palette.muted, fontSize: 11, fontWeight: '600' },
  selectedOptionText: { color: palette.green },
  deadlineNote: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  error: { color: palette.red, fontSize: 12 },
});
