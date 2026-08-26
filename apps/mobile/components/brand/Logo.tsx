import { Image, StyleSheet, Text, useColorScheme, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

type PowerChainLogoProps = {
  compact?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

const BRANDMARK_DARK = require('../../../../assets/icon-pack/masters/brandmark-dark.png');
const BRANDMARK_LIGHT = require('../../../../assets/icon-pack/masters/brandmark-light.png');

export function PowerChainLogo({ compact = false, size = 42, style, imageStyle }: PowerChainLogoProps) {
  const scheme = useColorScheme();
  const theme = useAppTheme();
  const source = scheme === 'dark' ? BRANDMARK_LIGHT : BRANDMARK_DARK;

  return (
    <View accessibilityRole="image" accessibilityLabel="PowerChain Copilot" style={[styles.row, style]}>
      <Image source={source} resizeMode="contain" style={[{ width: size, height: size }, imageStyle]} />
      {!compact ? (
        <View style={styles.wordmark}>
          <Text style={[styles.name, { color: theme.text }]}><Text style={styles.power}>Power</Text><Text style={styles.chain}>Chain</Text></Text>
          <Text style={[styles.product, { color: theme.textMuted }]}>COPILOT</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { gap: 3 },
  name: { fontSize: 18, letterSpacing: -0.4 },
  power: { fontWeight: '700' },
  chain: { fontWeight: '400' },
  product: { fontSize: 9, fontWeight: '700', letterSpacing: 2.4 },
});
