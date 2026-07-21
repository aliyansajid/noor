import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * Three distinct authentic Islamic vector emblems for the onboarding slides —
 * line-art, gold-gradient, no figurative imagery. Swap for illustrated assets later.
 */

type MotifProps = { size?: number };

const GOLD = '#E3C46B';

function GoldDefs() {
  return (
    <Defs>
      <LinearGradient id="motifGold" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FBEFC4" />
        <Stop offset="1" stopColor="#D9B354" />
      </LinearGradient>
    </Defs>
  );
}

/** 1 — Eight-pointed star rosette (khātim). */
export function StarRosette({ size = 120 }: MotifProps) {
  const c = size / 2;
  const sq = (radius: number, rot: number) =>
    [0, 1, 2, 3]
      .map((i) => {
        const a = (Math.PI / 2) * i + (rot * Math.PI) / 180;
        return `${c + radius * Math.cos(a)},${c + radius * Math.sin(a)}`;
      })
      .reduce((d, p, i) => d + (i === 0 ? `M${p}` : `L${p}`), '') + 'Z';

  const r = size * 0.46;
  const ri = size * 0.3;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <GoldDefs />
      <Path d={`${sq(r, 45)} ${sq(r, 0)}`} fill="url(#motifGold)" opacity={0.14} />
      <Path d={`${sq(r, 45)} ${sq(r, 0)}`} stroke="url(#motifGold)" strokeWidth={1.5} fill="none" />
      <Path d={`${sq(ri, 45)} ${sq(ri, 0)}`} stroke={GOLD} strokeWidth={1} fill="none" opacity={0.55} />
      <Circle cx={c} cy={c} r={size * 0.06} fill="url(#motifGold)" opacity={0.9} />
    </Svg>
  );
}

/** 2 — Mihrab arch (pointed prayer niche) with a hanging lamp. */
export function MihrabArch({ size = 120 }: MotifProps) {
  const w = size * 0.30; // half-width
  const c = size / 2;
  const top = size * 0.10;
  const spring = size * 0.42;
  const bottom = size * 0.92;

  const arch = (halfW: number, apexY: number, springY: number) =>
    `M${c - halfW},${bottom} L${c - halfW},${springY} Q${c - halfW},${apexY} ${c},${apexY} ` +
    `Q${c + halfW},${apexY} ${c + halfW},${springY} L${c + halfW},${bottom}`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <GoldDefs />
      {/* filled niche */}
      <Path d={`${arch(w, top, spring)} Z`} fill="url(#motifGold)" opacity={0.10} />
      {/* outer + inner arch outlines */}
      <Path d={arch(w, top, spring)} stroke="url(#motifGold)" strokeWidth={1.5} fill="none" />
      <Path
        d={arch(w * 0.66, top + size * 0.12, spring + size * 0.02)}
        stroke={GOLD}
        strokeWidth={1}
        fill="none"
        opacity={0.5}
      />
      {/* hanging lamp */}
      <Line x1={c} y1={top + size * 0.14} x2={c} y2={size * 0.5} stroke={GOLD} strokeWidth={1} opacity={0.6} />
      <Circle cx={c} cy={size * 0.56} r={size * 0.05} fill="url(#motifGold)" opacity={0.9} />
      <Circle cx={c} cy={size * 0.56} r={size * 0.09} stroke={GOLD} strokeWidth={1} fill="none" opacity={0.5} />
    </Svg>
  );
}

/** 3 — Lantern (fanoos) with a crescent and light. */
export function Lantern({ size = 120 }: MotifProps) {
  const c = size / 2;
  const bodyTop = size * 0.28;
  const bodyBottom = size * 0.78;
  const halfW = size * 0.20;

  const body =
    `M${c - halfW},${bodyTop + size * 0.06} Q${c - halfW},${bodyTop} ${c - halfW * 0.5},${bodyTop} ` +
    `L${c + halfW * 0.5},${bodyTop} Q${c + halfW},${bodyTop} ${c + halfW},${bodyTop + size * 0.06} ` +
    `L${c + halfW},${bodyBottom - size * 0.06} Q${c + halfW},${bodyBottom} ${c + halfW * 0.5},${bodyBottom} ` +
    `L${c - halfW * 0.5},${bodyBottom} Q${c - halfW},${bodyBottom} ${c - halfW},${bodyBottom - size * 0.06} Z`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <GoldDefs />
      {/* top cap + hook */}
      <Line x1={c} y1={size * 0.08} x2={c} y2={size * 0.16} stroke={GOLD} strokeWidth={1} opacity={0.6} />
      <Path d={`M${c - halfW * 0.6},${size * 0.2} L${c + halfW * 0.6},${size * 0.2}`} stroke="url(#motifGold)" strokeWidth={1.5} />
      <Path d={`M${c - halfW * 0.4},${size * 0.2} L${c - halfW},${bodyTop} M${c + halfW * 0.4},${size * 0.2} L${c + halfW},${bodyTop}`} stroke={GOLD} strokeWidth={1} opacity={0.6} />
      {/* body */}
      <Path d={body} fill="url(#motifGold)" opacity={0.10} />
      <Path d={body} stroke="url(#motifGold)" strokeWidth={1.5} fill="none" />
      {/* base */}
      <Path d={`M${c - halfW * 0.6},${bodyBottom + size * 0.02} L${c + halfW * 0.6},${bodyBottom + size * 0.02}`} stroke="url(#motifGold)" strokeWidth={1.5} />
      {/* crescent glow inside */}
      <G opacity={0.85}>
        <Circle cx={c + size * 0.02} cy={size * 0.53} r={size * 0.07} fill="url(#motifGold)" />
        <Circle cx={c + size * 0.055} cy={size * 0.51} r={size * 0.06} fill="#0E1512" />
      </G>
    </Svg>
  );
}

export const MOTIFS = { star: StarRosette, arch: MihrabArch, lantern: Lantern } as const;
export type MotifKey = keyof typeof MOTIFS;
