import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FundGoal, useAppData } from '@/components/app-data';
import { ActionButton, AppLoading, AppStorageError, Card, EmptyState, formatMoney, Page, PageHeader, palette, ProgressBar, SectionTitle } from '@/components/app-ui';

const goalColors = ['#286B58', '#D3945C', '#7886A6', '#B66E76', '#839B5A'];

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export default function MoneyTrackingScreen() {
  const { goals, addGoal, addContribution, togglePinned, ready, storageError, retryStorage } = useAppData();
  const [goalModal, setGoalModal] = useState(false);
  const [contributionGoal, setContributionGoal] = useState<FundGoal | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedColor, setSelectedColor] = useState(goalColors[0]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);

  if (storageError) return <AppStorageError message={storageError} onRetry={retryStorage} />;
  if (!ready) return <AppLoading />;

  function closeGoalModal() {
    setGoalModal(false);
    setName('');
    setTarget('');
    setDeadline('');
    setError('');
  }

  function saveGoal() {
    const goalName = name.trim();
    const goalTarget = Number(target);
    if (!goalName || !Number.isFinite(goalTarget) || goalTarget <= 0) {
      setError('Add a name and a target greater than zero.');
      return;
    }
    if (deadline && !isValidDate(deadline)) {
      setError('Use a real date in YYYY-MM-DD format.');
      return;
    }
    addGoal({ name: goalName, target: goalTarget, color: selectedColor, deadline: deadline || undefined });
    closeGoalModal();
  }

  function saveContribution() {
    const value = Number(amount);
    if (!contributionGoal || !Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    addContribution(contributionGoal.id, value);
    setContributionGoal(null);
    setAmount('');
    setError('');
  }

  return (
    <Page>
      <PageHeader
        eyebrow="MONEY"
        title="Make your money feel intentional."
        subtitle="Give every peso a destination, and celebrate the progress along the way." />

      <View style={styles.summaryRow}>
        <Card style={styles.totalCard}>
          <Text style={styles.summaryLabel}>TOTAL SAVED ACROSS YOUR FUNDS</Text>
          <Text style={styles.totalValue}>{formatMoney(totalSaved)}</Text>
          <Text style={styles.summaryFoot}>of {formatMoney(totalTarget)} in your goals</Text>
          {totalTarget > 0 ? <ProgressBar value={(totalSaved / totalTarget) * 100} /> : null}
        </Card>
        <Card style={styles.quickCard}>
          <Text style={styles.quickIcon}>✳</Text>
          <Text style={styles.quickTitle}>A goal for every big thing.</Text>
          <Text style={styles.quickDescription}>Add a fund, set a target, and build it one contribution at a time.</Text>
          <ActionButton label="Create a fund  ＋" onPress={() => setGoalModal(true)} />
        </Card>
      </View>

      <SectionTitle title="Your savings goals" />
      {goals.length ? (
        <View style={styles.goalGrid}>
          {goals.map((goal) => {
            const progress = Math.min(100, (goal.saved / goal.target) * 100);
            return (
              <Card key={goal.id} style={styles.goalCard}>
                <View style={styles.cardTop}>
                  <View style={[styles.goalIcon, { backgroundColor: `${goal.color}20` }]}>
                    <View style={[styles.goalIconDot, { backgroundColor: goal.color }]} />
                  </View>
                  <Pressable onPress={() => togglePinned(goal.id)} style={styles.pinButton}>
                    <Text style={[styles.pinText, goal.pinned && styles.pinnedText]}>{goal.pinned ? '★ Pinned' : '☆ Pin goal'}</Text>
                  </Pressable>
                </View>
                <Text style={styles.goalTitle}>{goal.name}</Text>
                <Text style={styles.goalAmount}>{formatMoney(goal.saved)} <Text style={styles.goalOf}>of {formatMoney(goal.target)}</Text></Text>
                <ProgressBar value={progress} color={goal.color} />
                <View style={styles.progressFooter}>
                  <Text style={styles.percentText}>{Math.round(progress)}% there</Text>
                  <Text style={styles.remainingText}>{formatMoney(Math.max(0, goal.target - goal.saved))} to go</Text>
                </View>
                {goal.deadline ? (
                  <View style={styles.deadlinePill}>
                    <Text style={styles.deadlineText}>◷　Target date · {new Date(`${goal.deadline}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  </View>
                ) : null}
                <ActionButton
                  label={goal.saved >= goal.target ? 'Add more  ＋' : 'Add to this fund  ＋'}
                  onPress={() => { setContributionGoal(goal); setAmount(''); setError(''); }}
                  secondary={goal.saved >= goal.target}
                />
              </Card>
            );
          })}
        </View>
      ) : (
        <Card><EmptyState title="Your next goal starts here" body="Create your first fund to start tracking what matters to you." /></Card>
      )}

      <Modal visible={goalModal} transparent animationType="fade" onRequestClose={closeGoalModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeading}>
              <View><Text style={styles.modalEyebrow}>NEW SAVINGS GOAL</Text><Text style={styles.modalTitle}>What are you saving for?</Text></View>
              <Pressable onPress={closeGoalModal} accessibilityLabel="Close"><Text style={styles.close}>×</Text></Pressable>
            </View>
            <Text style={styles.fieldLabel}>Goal name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. A rainy day fund" placeholderTextColor="#A0AAA4" style={styles.input} maxLength={50} />
            <Text style={styles.fieldLabel}>Target amount (₱)</Text>
            <TextInput value={target} onChangeText={setTarget} placeholder="100000" keyboardType="decimal-pad" style={styles.input} />
            <Text style={styles.fieldLabel}>Deadline <Text style={styles.optional}>(optional · YYYY-MM-DD)</Text></Text>
            <TextInput value={deadline} onChangeText={setDeadline} placeholder="2026-12-31" style={styles.input} />
            <Text style={styles.fieldLabel}>Choose a color</Text>
            <View style={styles.colorRow}>
              {goalColors.map((color) => (
                <Pressable key={color} onPress={() => setSelectedColor(color)} style={[styles.colorChoice, { backgroundColor: color }, selectedColor === color && styles.colorSelected]} />
              ))}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <ActionButton label="Create savings goal" onPress={saveGoal} />
          </View>
        </View>
      </Modal>

      <Modal visible={!!contributionGoal} transparent animationType="fade" onRequestClose={() => setContributionGoal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeading}>
              <View><Text style={styles.modalEyebrow}>ADD TO YOUR SAVINGS</Text><Text style={styles.modalTitle}>{contributionGoal?.name}</Text></View>
              <Pressable onPress={() => setContributionGoal(null)} accessibilityLabel="Close"><Text style={styles.close}>×</Text></Pressable>
            </View>
            <Text style={styles.fieldLabel}>How much are you adding? (₱)</Text>
            <TextInput value={amount} onChangeText={setAmount} placeholder="500" keyboardType="decimal-pad" style={styles.input} autoFocus />
            <View style={styles.amountChips}>
              {[500, 1000, 2500, 5000].map((value) => (
                <Pressable key={value} onPress={() => setAmount(String(value))} style={styles.amountChip}><Text style={styles.amountChipText}>{formatMoney(value)}</Text></Pressable>
              ))}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <ActionButton label="Add contribution" onPress={saveContribution} />
          </View>
        </View>
      </Modal>
    </Page>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  totalCard: { flexGrow: 1.4, flexBasis: 320, justifyContent: 'center', minHeight: 190 },
  summaryLabel: { color: palette.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  totalValue: { color: palette.ink, fontSize: 37, fontWeight: '700', marginTop: 1 },
  summaryFoot: { color: palette.muted, fontSize: 13 },
  quickCard: { flexGrow: 1, flexBasis: 260, backgroundColor: '#E8F0EC', borderColor: '#DFE9E3' },
  quickIcon: { color: palette.green, fontSize: 22 },
  quickTitle: { color: palette.ink, fontSize: 19, fontWeight: '700' },
  quickDescription: { color: '#66766F', fontSize: 13, lineHeight: 19 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  goalCard: { flexGrow: 1, flexBasis: 285, minWidth: 0 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  goalIconDot: { width: 13, height: 13, borderRadius: 7 },
  pinButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F6F7F4' },
  pinText: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  pinnedText: { color: palette.orange },
  goalTitle: { color: palette.ink, fontSize: 17, fontWeight: '700', marginTop: 3 },
  goalAmount: { color: palette.ink, fontSize: 22, fontWeight: '700' },
  goalOf: { color: palette.muted, fontSize: 13, fontWeight: '500' },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -7 },
  percentText: { color: palette.green, fontSize: 12, fontWeight: '700' },
  remainingText: { color: palette.muted, fontSize: 12 },
  deadlinePill: { backgroundColor: palette.paleOrange, borderRadius: 9, paddingVertical: 8, paddingHorizontal: 10 },
  deadlineText: { color: '#9B7146', fontSize: 11, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(27, 40, 35, .45)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: palette.white, borderRadius: 22, padding: 24, gap: 12 },
  modalHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  modalEyebrow: { color: palette.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 6 },
  modalTitle: { color: palette.ink, fontSize: 21, fontWeight: '700', flexShrink: 1 },
  close: { color: palette.muted, fontSize: 28, lineHeight: 28 },
  fieldLabel: { color: palette.ink, fontSize: 12, fontWeight: '700', marginTop: 3 },
  optional: { color: palette.muted, fontSize: 11, fontWeight: '400' },
  input: { height: 46, borderWidth: 1, borderColor: palette.line, backgroundColor: '#FBFCFA', borderRadius: 11, paddingHorizontal: 13, color: palette.ink, fontSize: 14 },
  colorRow: { flexDirection: 'row', gap: 12, paddingVertical: 2 },
  colorChoice: { width: 27, height: 27, borderRadius: 14 },
  colorSelected: { borderWidth: 3, borderColor: palette.ink },
  error: { color: palette.red, fontSize: 12 },
  amountChips: { flexDirection: 'row', gap: 8 },
  amountChip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 10, backgroundColor: palette.paleGreen },
  amountChipText: { color: palette.green, fontSize: 12, fontWeight: '700' },
});
