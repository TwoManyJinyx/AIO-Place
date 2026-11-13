import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppData } from '@/components/app-data';
import { ActionButton, AppLoading, AppStorageError, Card, Page, PageHeader, palette, ProgressBar } from '@/components/app-ui';

type Mode = 'timer' | 'stopwatch';

function formatDuration(milliseconds: number, hours = false) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const shownMinutes = hours || totalMinutes >= 60 ? String(minutes).padStart(2, '0') : String(totalMinutes).padStart(2, '0');
  const shownSeconds = String(seconds).padStart(2, '0');
  if (hours || totalMinutes >= 60) return `${String(Math.floor(totalSeconds / 3600)).padStart(2, '0')}:${shownMinutes}:${shownSeconds}`;
  return `${shownMinutes}:${shownSeconds}`;
}

export default function FocusScreen() {
  const { focus, updateFocus, ready, storageError, retryStorage } = useAppData();
  const [mode, setMode] = useState<Mode>(focus.mode ?? 'timer');
  const [now, setNow] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState('');
  const [timerError, setTimerError] = useState('');
  const [laps, setLaps] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const currentElapsed = focus.runningSince === null
    ? focus.elapsedMs
    : Math.max(focus.elapsedMs, focus.elapsedMs + now - focus.runningSince);
  const activeMode = focus.mode ?? mode;
  const timerInputValue = timerMinutes || String(focus.durationMs > 0 ? Math.round(focus.durationMs / 60000) : 25);
  const timeLeft = Math.max(0, focus.durationMs - currentElapsed);
  const displayTime = activeMode === 'timer' ? timeLeft : currentElapsed;
  const timerProgress = focus.durationMs > 0 ? Math.min(1, currentElapsed / focus.durationMs) : 0;
  const isRunning = focus.runningSince !== null;
  const modeName = activeMode === 'timer' ? 'Focus timer' : 'Stopwatch';

  useEffect(() => {
    if (focus.mode !== 'timer' || focus.runningSince === null || timeLeft > 0) return;
    updateFocus({
      ...focus,
      mode: null,
      elapsedMs: focus.durationMs,
      runningSince: null,
      lastSession: { label: `${Math.round(focus.durationMs / 60000)}-minute focus`, durationMs: focus.durationMs },
    });
  }, [focus, timeLeft, updateFocus]);

  if (storageError) return <AppStorageError message={storageError} onRetry={retryStorage} />;
  if (!ready) return <AppLoading />;

  function chooseMode(nextMode: Mode) {
    if (focus.runningSince !== null || nextMode === activeMode) return;
    const previousMode = focus.mode ?? activeMode;
    const lastSession = currentElapsed > 1000
      ? {
          label: previousMode === 'timer' ? 'Focus timer' : 'Stopwatch',
          durationMs: currentElapsed,
        }
      : focus.lastSession;
    setMode(nextMode);
    setLaps([]);
    setTimerError('');
    updateFocus({
      ...focus,
      mode: null,
      durationMs: nextMode === 'timer' && focus.durationMs <= 0 ? 25 * 60 * 1000 : focus.durationMs,
      elapsedMs: 0,
      runningSince: null,
      lastSession,
    });
  }

  function start() {
    if (activeMode === 'timer') {
      const minutes = Number(timerInputValue);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
        setTimerError('Choose a whole number of minutes from 1 to 600.');
        return;
      }
      const durationMs = minutes * 60 * 1000;
      const elapsedMs = focus.mode === 'timer' ? Math.min(focus.elapsedMs, durationMs) : 0;
      setTimerError('');
      updateFocus({ ...focus, mode: activeMode, durationMs, elapsedMs, runningSince: Date.now() });
    } else {
      updateFocus({
        ...focus,
        mode: activeMode,
        durationMs: 0,
        elapsedMs: focus.mode === 'stopwatch' ? focus.elapsedMs : 0,
        runningSince: Date.now(),
      });
    }
  }

  function pause() {
    updateFocus({ ...focus, elapsedMs: currentElapsed, runningSince: null });
  }

  function reset() {
    const currentSession = focus.mode && currentElapsed > 1000
      ? { label: activeMode === 'timer' ? 'Focus timer' : 'Stopwatch', durationMs: currentElapsed }
      : focus.lastSession;
    updateFocus({
      ...focus,
      mode: null,
      durationMs: activeMode === 'timer' ? focus.durationMs : 25 * 60 * 1000,
      elapsedMs: 0,
      runningSince: null,
      lastSession: currentSession,
    });
    setLaps([]);
    setTimerError('');
  }

  function recordLap() {
    setLaps((current) => [
      ...current,
      Math.max(0, currentElapsed - current.reduce((sum, lap) => sum + lap, 0)),
    ]);
  }

  return (
    <Page>
      <PageHeader
        eyebrow="FOCUS STUDIO"
        title="A moment, just for you."
        subtitle="Use a gentle timer for deep work, or a stopwatch to see where your time goes." />

      <View style={styles.layout}>
        <Card style={styles.timerCard}>
          <View style={styles.modeSelector}>
            {(['timer', 'stopwatch'] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => chooseMode(item)}
                style={[styles.modeTab, activeMode === item && styles.selectedModeTab, isRunning && styles.disabledTab]}>
                <Text style={[styles.modeTabText, activeMode === item && styles.selectedModeText]}>{item === 'timer' ? '◷  Timer' : '⏱  Stopwatch'}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.timerDial}>
            <View style={styles.timerFace}>
              <View style={styles.timerIcon}><Text style={styles.timerIconText}>{activeMode === 'timer' ? '◷' : '⏱'}</Text></View>
              <Text style={styles.timerState}>
                {isRunning
                  ? (activeMode === 'timer' ? 'FOCUS IN PROGRESS' : 'TIME IS RUNNING')
                  : activeMode === 'timer' && focus.mode === null && focus.elapsedMs >= focus.durationMs && focus.elapsedMs > 0
                    ? 'SESSION COMPLETE'
                    : currentElapsed > 0
                      ? 'PAUSED · PICK UP WHEN READY'
                      : activeMode === 'timer' ? 'A FRESH START' : 'READY WHEN YOU ARE'}
              </Text>
              <Text style={styles.timerDigits}>{formatDuration(displayTime)}</Text>
              <Text style={styles.timerCaption}>{modeName} · {isRunning ? 'you’ve got this' : activeMode === 'timer' ? 'make a little space' : 'measure the moment'}</Text>
            </View>
          </View>

          {activeMode === 'timer' ? (
            <View style={styles.durationSection}>
              <Text style={styles.durationLabel}>SESSION LENGTH</Text>
              <View style={styles.durationChoices}>
                {[15, 25, 45].map((minutes) => (
                  <Pressable key={minutes} onPress={() => { if (!isRunning) { setTimerMinutes(String(minutes)); setTimerError(''); } }} style={[styles.durationChip, timerInputValue === String(minutes) && styles.selectedDuration]}>
                    <Text style={[styles.durationText, timerInputValue === String(minutes) && styles.selectedDurationText]}>{minutes} min</Text>
                  </Pressable>
                ))}
                <TextInput
                  accessibilityLabel="Timer length in minutes"
                  keyboardType="number-pad"
                  value={timerInputValue}
                  onChangeText={(value) => { setTimerMinutes(value); setTimerError(''); }}
                  editable={!isRunning}
                  style={styles.durationInput}
                  maxLength={3}
                />
              </View>
              {timerError ? <Text style={styles.timerError}>{timerError}</Text> : null}
              <ProgressBar value={timerProgress * 100} color={palette.green} />
            </View>
          ) : null}

          <View style={styles.controls}>
            {isRunning ? (
              <ActionButton label="Pause" onPress={pause} />
            ) : (
              <ActionButton label={currentElapsed > 0 ? 'Resume session' : 'Start session'} onPress={start} />
            )}
            <ActionButton label="Reset" onPress={reset} secondary />
            {activeMode === 'stopwatch' && isRunning ? <ActionButton label="Lap" onPress={recordLap} secondary /> : null}
          </View>
          {activeMode === 'timer' && !isRunning ? <Text style={styles.tip}>Tip: silence notifications and give yourself permission to focus on one thing.</Text> : null}
        </Card>

        <View style={styles.sideColumn}>
          <Card style={styles.sessionCard}>
            <Text style={styles.sideEyebrow}>YOUR LAST SESSION</Text>
            {focus.lastSession ? (
              <>
                <Text style={styles.lastTitle}>{focus.lastSession.label}</Text>
                <Text style={styles.lastDuration}>{formatDuration(focus.lastSession.durationMs)} <Text style={styles.lastUnit}>focused</Text></Text>
                <Text style={styles.lastNote}>Every focused moment counts. Nice work showing up.</Text>
              </>
            ) : (
              <View style={styles.emptySession}>
                <Text style={styles.emptyIcon}>✳</Text>
                <Text style={styles.lastTitle}>Your first session is waiting.</Text>
                <Text style={styles.lastNote}>When you finish a session, you’ll find it here.</Text>
              </View>
            )}
          </Card>

          {laps.length ? (
            <Card style={styles.sessionCard}>
              <Text style={styles.sideEyebrow}>LAP TIMES</Text>
              {laps.map((lap, index) => (
                <View key={`${lap}-${index}`} style={styles.lapLine}>
                  <Text style={styles.lastNote}>Lap {index + 1}</Text>
                  <Text style={styles.lapValue}>{formatDuration(lap)}</Text>
                </View>
              ))}
            </Card>
          ) : (
            <Card style={styles.quoteCard}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.quote}>You don’t have to see the whole staircase, just take the first step.</Text>
              <Text style={styles.quoteBy}>— MARTIN LUTHER KING JR.</Text>
            </Card>
          )}
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  layout: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 },
  timerCard: { flexGrow: 1.5, flexBasis: 440, alignItems: 'center', paddingHorizontal: 18, paddingVertical: 24 },
  modeSelector: { flexDirection: 'row', padding: 4, backgroundColor: '#F3F5F2', borderRadius: 13, alignSelf: 'center', gap: 3 },
  modeTab: { minHeight: 38, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  selectedModeTab: { backgroundColor: palette.white },
  disabledTab: { opacity: 0.65 },
  modeTabText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  selectedModeText: { color: palette.green },
  timerDial: {
    width: '100%',
    maxWidth: 260,
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DCE9E1',
    backgroundColor: '#F8FBF8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  timerFace: { width: '100%', alignItems: 'center', gap: 7 },
  timerIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: palette.paleGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  timerIconText: { color: palette.green, fontSize: 23 },
  timerState: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  timerDigits: { color: palette.ink, fontSize: 62, lineHeight: 70, fontWeight: '500', fontVariant: ['tabular-nums'] },
  timerCaption: { color: palette.muted, fontSize: 12 },
  durationSection: { width: '100%', gap: 12, paddingVertical: 9 },
  durationLabel: { color: palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  durationChoices: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  durationChip: { paddingVertical: 8, paddingHorizontal: 11, backgroundColor: '#F4F6F3', borderRadius: 9 },
  selectedDuration: { backgroundColor: palette.paleGreen },
  durationText: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  selectedDurationText: { color: palette.green },
  durationInput: { width: 65, height: 34, borderWidth: 1, borderColor: palette.line, borderRadius: 9, textAlign: 'center', color: palette.ink, fontSize: 12 },
  timerError: { color: palette.red, fontSize: 11 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 9, paddingTop: 10, flexWrap: 'wrap' },
  tip: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5, maxWidth: 350 },
  sideColumn: { flexGrow: 1, flexBasis: 250, maxWidth: '100%', minWidth: 0, gap: 16 },
  sessionCard: { minHeight: 205 },
  sideEyebrow: { color: palette.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  lastTitle: { color: palette.ink, fontSize: 18, fontWeight: '700', lineHeight: 24 },
  lastDuration: { color: palette.ink, fontSize: 25, fontWeight: '700' },
  lastUnit: { color: palette.muted, fontSize: 12, fontWeight: '500' },
  lastNote: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  emptySession: { gap: 9, paddingTop: 14 },
  emptyIcon: { color: palette.orange, fontSize: 24 },
  quoteCard: { backgroundColor: '#F8EEE3', borderColor: '#F2E5D7', gap: 8 },
  quoteMark: { color: palette.orange, fontSize: 39, height: 31, lineHeight: 42 },
  quote: { color: '#675543', fontSize: 15, lineHeight: 22, fontWeight: '600' },
  quoteBy: { color: '#9B8061', fontSize: 9, letterSpacing: 1, fontWeight: '800', marginTop: 4 },
  lapLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: palette.line },
  lapValue: { color: palette.ink, fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: '700' },
});
