import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppData } from '@/components/app-data';
import { AppLoading, AppStorageError, Card, EmptyState, formatMoney, Page, PageHeader, palette, ProgressBar, SectionTitle } from '@/components/app-ui';

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DashboardScreen() {
  const { goals, schedule, focus, toggleScheduleItem, ready, storageError, retryStorage } = useAppData();
  const [now, setNow] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const pinnedGoal = goals.find((goal) => goal.pinned) ?? goals[0];
  const todayKey = dateKey(new Date());
  const todaysSchedule = schedule
    .filter((item) => item.date === todayKey)
    .sort((a, b) => a.time.localeCompare(b.time));
  const activeMs = focus.runningSince === null
    ? focus.elapsedMs
    : Math.max(focus.elapsedMs, focus.elapsedMs + now - focus.runningSince);
  const focusTime = focus.mode === 'timer'
    ? Math.max(0, focus.durationMs - activeMs)
    : activeMs;

  if (storageError) return <AppStorageError message={storageError} onRetry={retryStorage} />;
  if (!ready) return <AppLoading />;

  return (
    <Page>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
        title="A little more in balance."
        subtitle="Your money, plans, and focus — all in one calm place." />

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL SAVED</Text>
          <Text style={styles.statValue}>{formatMoney(totalSaved)}</Text>
          <Text style={styles.statFoot}>{goals.length} active fund{goals.length === 1 ? '' : 's'}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>ON YOUR CALENDAR</Text>
          <Text style={styles.statValue}>{todaysSchedule.filter((item) => !item.done).length}</Text>
          <Text style={styles.statFoot}>things to do today</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>FOCUS SESSION</Text>
          <Text style={styles.statValue}>{focus.mode ? (focus.runningSince ? 'In progress' : 'Paused') : 'Ready when you are'}</Text>
          <Text style={styles.statFoot}>
            {focus.mode
              ? `${Math.floor(focusTime / 60000)}:${String(Math.floor((focusTime % 60000) / 1000)).padStart(2, '0')} ${focus.mode === 'timer' ? 'remaining' : 'elapsed'}`
              : focus.lastSession
                ? `Last: ${focus.lastSession.label}`
                : 'No sessions yet'}
          </Text>
        </Card>
      </View>

      <View style={styles.columns}>
        <Card style={styles.featureCard}>
          <SectionTitle
            title="Your focus fund"
            action={<Link href="/money-tracking" asChild><Pressable><Text style={styles.inlineLink}>All funds ↗</Text></Pressable></Link>} />
          {pinnedGoal ? (
            <>
              <View style={styles.goalLine}>
                <View style={[styles.goalDot, { backgroundColor: pinnedGoal.color }]} />
                <Text style={styles.goalName}>{pinnedGoal.name}</Text>
                <Text style={styles.goalPercent}>{Math.min(100, Math.round((pinnedGoal.saved / pinnedGoal.target) * 100))}%</Text>
              </View>
              <ProgressBar value={(pinnedGoal.saved / pinnedGoal.target) * 100} color={pinnedGoal.color} />
              <View style={styles.moneyLine}>
                <Text style={styles.savedAmount}>{formatMoney(pinnedGoal.saved)} saved</Text>
                <Text style={styles.goalTarget}>of {formatMoney(pinnedGoal.target)}</Text>
              </View>
              {pinnedGoal.deadline ? <Text style={styles.deadline}>Target date · {new Date(`${pinnedGoal.deadline}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text> : null}
            </>
          ) : (
            <EmptyState title="Start with a goal" body="Create a fund and watch your progress grow." />
          )}
          <Link href="/money-tracking" asChild>
            <Pressable style={styles.softButton}><Text style={styles.softButtonText}>Add to savings　＋</Text></Pressable>
          </Link>
        </Card>

        <Card style={styles.featureCard}>
          <SectionTitle
            title="Today’s plan"
            action={<Link href="/schedule" asChild><Pressable><Text style={styles.inlineLink}>Open calendar ↗</Text></Pressable></Link>} />
          {todaysSchedule.length ? (
            <View style={styles.agenda}>
              {todaysSchedule.slice(0, 4).map((item) => (
                <Pressable key={item.id} style={styles.agendaItem} onPress={() => toggleScheduleItem(item.id)}>
                  <View style={[styles.check, item.done && styles.checkDone]}>
                    {item.done ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <View style={styles.agendaText}>
                    <Text style={[styles.agendaTitle, item.done && styles.completed]}>{item.title}</Text>
                    <Text style={styles.agendaTime}>{item.type === 'deadline' ? 'Fund deadline' : formatTime(item.time)}</Text>
                  </View>
                  <View style={[styles.agendaDot, { backgroundColor: item.type === 'deadline' ? palette.orange : palette.green }]} />
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyState title="A clear day" body="Add a plan to your calendar whenever you’re ready." />
          )}
          <Link href="/schedule" asChild>
            <Pressable style={styles.softButton}><Text style={styles.softButtonText}>Plan something　＋</Text></Pressable>
          </Link>
        </Card>
      </View>

      <View style={styles.bottomRow}>
        <Card style={styles.secondaryCard}>
          <SectionTitle title="Your funds" action={<Link href="/money-tracking" asChild><Pressable><Text style={styles.inlineLink}>View all ↗</Text></Pressable></Link>} />
          {goals.slice(0, 3).map((goal) => (
            <View key={goal.id} style={styles.miniGoal}>
              <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
              <Text style={styles.miniGoalName} numberOfLines={1}>{goal.name}</Text>
              <Text style={styles.miniGoalValue}>{formatMoney(goal.saved)}</Text>
            </View>
          ))}
          {!goals.length ? <EmptyState title="No funds yet" body="Create your first savings goal." /> : null}
        </Card>
        <Card style={[styles.secondaryCard, styles.focusCard]}>
          <Text style={styles.focusKicker}>MAKE ROOM TO FOCUS</Text>
          <Text style={styles.focusTitle}>Small steps add up.</Text>
          <Text style={styles.focusBody}>Take a moment for the task in front of you.</Text>
          <Link href="/focus" asChild>
            <Pressable style={styles.focusLink}>
              <Text style={styles.focusLinkText}>{focus.mode ? 'Return to your session →' : 'Start a focus session →'}</Text>
            </Pressable>
          </Link>
        </Card>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  statCard: { flexGrow: 1, flexBasis: 185, minHeight: 125, gap: 9, padding: 18 },
  statLabel: { color: palette.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: palette.ink, fontSize: 25, fontWeight: '700' },
  statFoot: { color: palette.muted, fontSize: 12 },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  featureCard: { flexGrow: 1, flexBasis: 330, minWidth: 0 },
  inlineLink: { color: palette.green, fontSize: 12, fontWeight: '700' },
  goalLine: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 6 },
  goalDot: { width: 10, height: 10, borderRadius: 5 },
  goalName: { color: palette.ink, fontSize: 14, fontWeight: '700', flex: 1 },
  goalPercent: { color: palette.green, fontWeight: '800', fontSize: 14 },
  moneyLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -7 },
  savedAmount: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  goalTarget: { color: palette.muted, fontSize: 12 },
  deadline: { color: palette.muted, fontSize: 12 },
  softButton: { backgroundColor: palette.paleGreen, minHeight: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  softButtonText: { color: palette.green, fontSize: 13, fontWeight: '700' },
  agenda: { gap: 2 },
  agendaItem: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
  check: { width: 19, height: 19, borderWidth: 1.5, borderColor: '#CED6D1', borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: palette.green, borderColor: palette.green },
  checkmark: { color: palette.white, fontSize: 12, fontWeight: '800' },
  agendaText: { flex: 1, gap: 3 },
  agendaTitle: { color: palette.ink, fontSize: 13, fontWeight: '600' },
  completed: { color: palette.muted, textDecorationLine: 'line-through' },
  agendaTime: { color: palette.muted, fontSize: 11 },
  agendaDot: { width: 7, height: 7, borderRadius: 4 },
  bottomRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  secondaryCard: { flexGrow: 1, flexBasis: 260 },
  miniGoal: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  miniGoalName: { color: palette.ink, fontSize: 13, flex: 1 },
  miniGoalValue: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  focusCard: { backgroundColor: '#E8F0EC', borderColor: '#DFE9E3' },
  focusKicker: { color: palette.green, fontSize: 10, letterSpacing: 1.1, fontWeight: '800' },
  focusTitle: { color: palette.ink, fontSize: 21, fontWeight: '700' },
  focusBody: { color: '#66766F', fontSize: 13 },
  focusLink: { minHeight: 44, paddingHorizontal: 17, borderRadius: 12, backgroundColor: palette.green, alignItems: 'center', justifyContent: 'center' },
  focusLinkText: { color: palette.white, fontSize: 13, fontWeight: '700' },
});
