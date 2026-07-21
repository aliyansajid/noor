import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { PLAN_DAYS } from '@/features/onboarding/content';

const GUTTER = 92;
const ROW = 118;
const NODE_R = 20;
const nodeX = (i: number) => (i % 2 === 0 ? 32 : 60);
const nodeY = (i: number) => i * ROW + ROW / 2;

/** The payoff: a personalized journey shown as a winding trail of milestones. */
export function PlanReveal({ onContinue }: { onContinue: () => void }) {
  const trailHeight = PLAN_DAYS.length * ROW;

  // Smooth serpentine path connecting each milestone node.
  let path = `M ${nodeX(0)} ${nodeY(0)}`;
  for (let i = 1; i < PLAN_DAYS.length; i++) {
    const x0 = nodeX(i - 1);
    const y0 = nodeY(i - 1);
    const x1 = nodeX(i);
    const y1 = nodeY(i);
    const cy = (y0 + y1) / 2;
    path += ` C ${x0} ${cy}, ${x1} ${cy}, ${x1} ${y1}`;
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <ThemedText type="label" style={styles.eyebrow}>
          YOUR JOURNEY
        </ThemedText>
        <ThemedText type="title" style={styles.title}>
          Finding light, day by day
        </ThemedText>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <ThemedText type="caption" style={styles.chipText}>
              ✦ 7 days
            </ThemedText>
          </View>
          <View style={styles.chip}>
            <ThemedText type="caption" style={styles.chipText}>
              ◷ under 5 min a day
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.trail, { height: trailHeight }]}>
          {/* the winding path + nodes */}
          <Svg width={GUTTER} height={trailHeight} style={styles.rail}>
            <Defs>
              <LinearGradient id="trail" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#E3C46B" />
                <Stop offset="1" stopColor="#1B6B52" />
              </LinearGradient>
            </Defs>
            <Path d={path} stroke="url(#trail)" strokeWidth={2.5} strokeDasharray="1 9" strokeLinecap="round" fill="none" />
            {PLAN_DAYS.map((d, i) => (
              <React.Fragment key={d.day}>
                <Circle cx={nodeX(i)} cy={nodeY(i)} r={NODE_R} fill="#16211C" stroke={Palette.gold} strokeWidth={1.5} />
                <SvgText
                  x={nodeX(i)}
                  y={nodeY(i) + 5}
                  fontSize={15}
                  fontWeight="700"
                  fill={Palette.gold}
                  textAnchor="middle"
                >
                  {d.day}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>

          {/* milestone cards, each vertically centered in its row slot */}
          <View style={styles.cards}>
            {PLAN_DAYS.map((d) => (
              <View key={d.day} style={styles.rowSlot}>
                <View style={styles.card}>
                  <ThemedText type="subtitle" style={styles.cardTitle}>
                    {d.title}
                  </ThemedText>
                  <ThemedText type="small" style={styles.cardDetail}>
                    {d.detail}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Begin my journey" onPress={onContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.md },
  eyebrow: { color: Palette.gold, letterSpacing: 1.5 },
  title: { color: '#EDE9DF' },
  chips: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(227,196,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(227,196,107,0.25)',
  },
  chipText: { color: Palette.gold },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  trail: { flexDirection: 'row' },
  rail: { position: 'absolute', left: 0, top: 0 },
  cards: { flex: 1, marginLeft: GUTTER + Spacing.sm },
  rowSlot: { height: ROW, justifyContent: 'center' },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(237,233,223,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(237,233,223,0.10)',
    gap: 4,
  },
  cardTitle: { color: '#EDE9DF' },
  cardDetail: { color: '#A7B0A9' },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, paddingTop: Spacing.sm },
});
