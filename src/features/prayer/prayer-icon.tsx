import Svg, { Circle, G, Path } from 'react-native-svg';

/** Small line icon for each prayer (used in the Home prayer strip). */
export function PrayerIcon({ name, size = 18, color }: { name: string; size?: number; color: string }) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G {...stroke}>
        {name === 'Fajr' ? (
          <Path d="M20 14.5A8 8 0 1 1 9.5 4 6.3 6.3 0 0 0 20 14.5z" />
        ) : name === 'Sunrise' ? (
          <>
            <Path d="M3 19h18" />
            <Path d="M7.5 19a4.5 4.5 0 0 1 9 0" />
            <Path d="M12 3.5v3M5.2 8.2l1.5 1.5M18.8 8.2l-1.5 1.5" />
          </>
        ) : name === 'Dhuhr' ? (
          <>
            <Circle cx="12" cy="12" r="4" />
            <Path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </>
        ) : name === 'Asr' ? (
          <>
            <Circle cx="8.5" cy="8.5" r="3" />
            <Path d="M8.5 3v1.6M3.9 8.5H2.3M4.8 4.8l1.1 1.1" />
            <Path d="M17 19a3.3 3.3 0 1 0 0-6.5 4.1 4.1 0 0 0-7.8-1A3.4 3.4 0 0 0 9 19z" />
          </>
        ) : name === 'Maghrib' ? (
          <>
            <Path d="M3 19h18" />
            <Path d="M7.5 19a4.5 4.5 0 0 1 9 0" />
            <Path d="M12 8.5v-5M9.5 6l2.5 2.5L14.5 6" />
          </>
        ) : (
          // Isha — crescent + star
          <Path d="M19 13.5A7 7 0 1 1 10.5 5 5.5 5.5 0 0 0 19 13.5z" />
        )}
      </G>
      {name === 'Isha' ? (
        <Path
          d="M17.5 4l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3L15.7 6l1.3-.5z"
          fill={color}
        />
      ) : null}
    </Svg>
  );
}
