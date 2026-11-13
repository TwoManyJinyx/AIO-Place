import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export const palette = {
  ink: '#102D23',
  muted: '#687C70',
  green: '#126343',
  paleGreen: '#E4F1E8',
  paper: '#F4F8F4',
  white: '#FFFFFF',
  line: '#DCE8DE',
  mint: '#55E3A7',
  orange: '#D3945C',
  paleOrange: '#F8EEE3',
  red: '#C4635D',
};

const moneyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <View style={styles.pageShell}>
      <View pointerEvents="none" style={styles.artwork}>
        <View style={styles.artGlow} />
        <View style={styles.artBeamWide} />
        <View style={styles.artBeamDark} />
        <View style={styles.artBeamLight} />
        <View style={styles.artBeamMint} />
        <View style={styles.artOutline} />
        <View style={styles.artOutlineInner} />
      </View>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.eyebrowPill}>
        <View style={styles.eyebrowDot} />
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function AppLoading() {
  return (
    <View style={styles.loading}>
      <View style={styles.loadingMark}>
        <ActivityIndicator color={palette.white} />
      </View>
      <Text style={styles.loadingText}>Getting your day in order…</Text>
    </View>
  );
}

export function AppStorageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.storageError}>
      <View style={styles.loadingMark}>
        <Text style={styles.errorMark}>!</Text>
      </View>
      <Text style={styles.errorTitle}>Your data needs attention</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <ActionButton label="Try again" onPress={onRetry} />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {action}
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  secondary = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        compact && styles.compactButton,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({
  value,
  color = palette.green,
}: {
  value: number;
  color?: string;
}) {
  const percentage = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageShell: { flex: 1, backgroundColor: palette.paper },
  artwork: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 480,
    overflow: 'hidden',
  },
  artGlow: {
    position: 'absolute',
    width: 580,
    height: 580,
    borderRadius: 290,
    top: -350,
    right: -100,
    backgroundColor: '#B9E6CC',
    opacity: 0.48,
  },
  artBeamWide: {
    position: 'absolute',
    width: 1200,
    height: 74,
    top: 168,
    right: -600,
    backgroundColor: '#6EAA82',
    opacity: 0.1,
    transform: [{ rotate: '-31deg' }],
  },
  artBeamDark: {
    position: 'absolute',
    width: 1000,
    height: 27,
    top: 216,
    right: -550,
    backgroundColor: '#0E5336',
    opacity: 0.1,
    transform: [{ rotate: '-31deg' }],
  },
  artBeamLight: {
    position: 'absolute',
    width: 1200,
    height: 5,
    top: 112,
    right: -610,
    backgroundColor: '#FFFFFF',
    opacity: 0.92,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    transform: [{ rotate: '-31deg' }],
  },
  artBeamMint: {
    position: 'absolute',
    width: 900,
    height: 3,
    top: 274,
    right: -475,
    backgroundColor: palette.mint,
    opacity: 0.74,
    shadowColor: palette.mint,
    shadowOpacity: 0.85,
    shadowRadius: 10,
    transform: [{ rotate: '-31deg' }],
  },
  artOutline: {
    position: 'absolute',
    width: 500,
    height: 188,
    top: 80,
    right: -40,
    borderWidth: 1,
    borderColor: '#4C8061',
    opacity: 0.14,
    transform: [{ rotate: '-31deg' }],
  },
  artOutlineInner: {
    position: 'absolute',
    width: 360,
    height: 128,
    top: 116,
    right: 82,
    borderWidth: 1,
    borderColor: '#4C8061',
    opacity: 0.12,
    transform: [{ rotate: '-31deg' }],
  },
  screen: { flex: 1, backgroundColor: 'transparent' },
  page: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 52,
    gap: 24,
  },
  header: { gap: 6, marginBottom: 2 },
  eyebrowPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#E7F3EA',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 5,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.green },
  eyebrow: { color: palette.green, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: palette.ink, fontSize: 31, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  card: {
    minWidth: 0,
    maxWidth: '100%',
    flexShrink: 1,
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 22,
    gap: 16,
    shadowColor: '#073E26',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.055,
    shadowRadius: 18,
    elevation: 3,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeading: { color: palette.ink, fontSize: 17, fontWeight: '700' },
  button: {
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 9,
    backgroundColor: palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: { backgroundColor: palette.paleGreen },
  compactButton: { minHeight: 36, paddingHorizontal: 12 },
  buttonText: { color: palette.white, fontSize: 13, fontWeight: '700' },
  secondaryButtonText: { color: palette.green },
  pressed: { opacity: 0.78 },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#E5ECE6', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  emptyState: { paddingVertical: 24, alignItems: 'center', gap: 6 },
  emptyTitle: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  emptyBody: { color: palette.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    backgroundColor: palette.paper,
  },
  loadingMark: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.green,
  },
  loadingText: { color: palette.muted, fontSize: 13, fontWeight: '600' },
  storageError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    padding: 28,
    backgroundColor: palette.paper,
  },
  errorMark: { color: palette.white, fontSize: 23, fontWeight: '700' },
  errorTitle: { color: palette.ink, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  errorMessage: { maxWidth: 360, color: palette.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
