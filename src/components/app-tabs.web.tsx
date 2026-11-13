import { TabList, TabListProps, TabSlot, TabTrigger, TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { palette } from '@/components/app-ui';

const links = [
  { name: 'home', href: '/', label: 'Overview', compactLabel: 'Home', icon: '⌂' },
  { name: 'money', href: '/money-tracking', label: 'My funds', compactLabel: 'Money', icon: '◉' },
  { name: 'schedule', href: '/schedule', label: 'Schedule', compactLabel: 'Plan', icon: '▦' },
  { name: 'focus', href: '/focus', label: 'Focus timer', compactLabel: 'Focus', icon: '◷' },
] as const;

export default function AppTabs() {
  const compact = useWindowDimensions().width < 560;

  return (
    <Tabs>
      <TabList asChild>
        <NavigationBar>
          <View style={[styles.brand, compact && styles.brandCompact]}>
            <View style={styles.brandMark}>
              <Text style={styles.brandGlyph}>d</Text>
            </View>
            <Text style={styles.brandName}>daymark</Text>
          </View>
          {links.map((link) => (
            <TabTrigger key={link.name} name={link.name} href={link.href} asChild>
              <NavigationLink icon={link.icon}>{compact ? link.compactLabel : link.label}</NavigationLink>
            </TabTrigger>
          ))}
          <Text style={[styles.profileBadge, compact && styles.hidden]}>D</Text>
        </NavigationBar>
      </TabList>
      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

function NavigationLink({
  children,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: string }) {
  const compact = useWindowDimensions().width < 560;
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.link,
        compact && styles.compactLink,
        isFocused && styles.activeLink,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.linkIcon, isFocused && styles.activeLinkText]}>{icon}</Text>
      <Text style={[styles.linkText, isFocused && styles.activeLinkText]}>{children}</Text>
    </Pressable>
  );
}

function NavigationBar(props: TabListProps) {
  return <View {...props} style={styles.nav} />;
}

const styles = StyleSheet.create({
  nav: {
    width: '100%',
    backgroundColor: '#FBFDFC',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE8DE',
    zIndex: 2,
    maxWidth: 1120,
    minHeight: 76,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginRight: 'auto' },
  brandCompact: { flexBasis: '100%', marginRight: 0 },
  brandMark: {
    width: 31,
    height: 31,
    borderRadius: 7,
    backgroundColor: palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGlyph: { color: '#FFFFFF', fontSize: 21, lineHeight: 25, fontWeight: '700' },
  brandName: { color: palette.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  link: {
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 11,
  },
  compactLink: { flexBasis: '23%', flexGrow: 1, justifyContent: 'center', paddingHorizontal: 6 },
  activeLink: { backgroundColor: palette.paleGreen },
  linkIcon: { color: '#7A8781', fontSize: 17 },
  linkText: { color: '#65736D', fontSize: 13, fontWeight: '600' },
  activeLinkText: { color: palette.green },
  profileBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#F3E9DD',
    color: '#99734C',
    fontSize: 13,
    fontWeight: '700',
  },
  hidden: { display: 'none' },
  slot: { flex: 1, backgroundColor: '#F5F6F2' },
  pressed: { opacity: 0.7 },
});
