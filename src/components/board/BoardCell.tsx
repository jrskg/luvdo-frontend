import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BOARD_COLORS } from '../../constants/theme';
import { PLAYER_COLOR_LIGHT } from '../../constants/board.constants';
import { PlayerColor } from '../../types/game.types';

type CellType = 'normal' | 'safe' | 'star' | 'home_column' | 'center' | 'base_area';

interface Props {
  type: CellType;
  color?: PlayerColor;
  size: number;
  iconRotation?: string;
}

const VIVID: Record<string, string> = BOARD_COLORS;

const CELL_BORDER = '#cccccc';

export function BoardCell({ type, color, size, iconRotation = '0deg' }: Props) {
  const bg = getBg(type, color);
  const iconTransform = [{ rotate: iconRotation }];

  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: bg,
          borderColor: CELL_BORDER,
          borderWidth: type === 'base_area' ? 0 : 0.5,
        },
      ]}
    >
      {/* safe = player start positions → white star, counter-rotated to stay upright */}
      {type === 'safe' && (
        <Text style={[styles.icon, { fontSize: size * 0.62, color: 'white', transform: iconTransform }]}>★</Text>
      )}
      {/* star = safe/protected spots → heart, counter-rotated to stay upright */}
      {type === 'star' && (
        <Text style={[styles.icon, { fontSize: size * 0.48, transform: iconTransform }]}>❤️</Text>
      )}
    </View>
  );
}

function getBg(type: CellType, color?: PlayerColor): string {
  if (type === 'base_area') return color ? VIVID[color] : '#eee';
  if (type === 'home_column') return color ? VIVID[color] : '#eee';
  if (type === 'center') return '#ffffff';
  if (type === 'safe') return color ? VIVID[color] : '#FFF9C4';
  if (type === 'star') return color ? PLAYER_COLOR_LIGHT[color] : '#E8F5E9';
  if (type === 'normal' && color) return PLAYER_COLOR_LIGHT[color];
  return '#fafafa';
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', justifyContent: 'center' },
  icon: {},
});
