import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { EdgeOrientation, GameState } from '../types/game';
import { THEME } from '../constants/theme';

interface BoardViewProps {
  state: GameState;
  onClaimEdge: (orientation: EdgeOrientation, row: number, col: number) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({ state, onClaimEdge }) => {
  const [containerDimensions, setContainerDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerDimensions({ width, height });
    }
  };

  const { gridRows, gridCols, players, currentPlayerIndex } = state;
  const activePlayer = players[currentPlayerIndex];

  // Map player ID to player info for quick lookup
  const playerMap = React.useMemo(() => {
    const map = new Map<string, (typeof players)[0]>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, [players]);

  if (!containerDimensions) {
    return <View style={styles.container} onLayout={handleLayout} />;
  }

  const { width: availWidth, height: availHeight } = containerDimensions;

  // Calculate cell size to best fit available space
  const horizontalGaps = gridCols - 1;
  const verticalGaps = gridRows - 1;

  const paddingH = 36;
  const paddingV = 36;

  const maxCellWidth = (availWidth - paddingH) / horizontalGaps;
  const maxCellHeight = (availHeight - paddingV) / verticalGaps;

  const cellSize = Math.floor(Math.max(40, Math.min(88, Math.min(maxCellWidth, maxCellHeight))));
  const boardWidth = horizontalGaps * cellSize;
  const boardHeight = verticalGaps * cellSize;

  const dotRadius = 5.5;
  const hitThickness = 44; // Comfortable 44pt touch target

  // Render Completed Boxes
  const renderBoxes = () => {
    const boxElements = [];
    for (let r = 0; r < gridRows - 1; r++) {
      for (let c = 0; c < gridCols - 1; c++) {
        const boxId = `b_${r}_${c}`;
        const box = state.boxes[boxId];
        const isCompleted = Boolean(box?.completedByPlayerId);
        const owner = box?.completedByPlayerId
          ? playerMap.get(box.completedByPlayerId)
          : null;

        boxElements.push(
          <View
            key={boxId}
            style={[
              styles.boxCell,
              {
                left: c * cellSize,
                top: r * cellSize,
                width: cellSize,
                height: cellSize,
                backgroundColor: isCompleted && owner ? `${owner.color}18` : 'transparent',
              },
            ]}
          >
            {isCompleted && owner && (
              <View
                style={[
                  styles.stampCircle,
                  { borderColor: owner.color, backgroundColor: `${owner.color}25` },
                ]}
              >
                <Text style={[styles.stampInitial, { color: owner.color }]}>
                  {box.playerInitial || owner.initial}
                </Text>
              </View>
            )}
          </View>
        );
      }
    }
    return boxElements;
  };

  // Render Horizontal Edges
  const renderHorizontalEdges = () => {
    const edges = [];
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols - 1; c++) {
        const edgeKey = `h_${r}_${c}`;
        const claimedBy = state.horizontalEdges[edgeKey];
        const isClaimed = Boolean(claimedBy);
        const owner = claimedBy ? playerMap.get(claimedBy) : null;

        edges.push(
          <TouchableOpacity
            key={edgeKey}
            activeOpacity={isClaimed ? 1 : 0.6}
            disabled={isClaimed || state.isGameOver}
            onPress={() => onClaimEdge('horizontal', r, c)}
            style={[
              styles.horizontalHitbox,
              {
                left: c * cellSize + dotRadius,
                top: r * cellSize - hitThickness / 2,
                width: cellSize - dotRadius * 2,
                height: hitThickness,
              },
            ]}
          >
            <View
              style={[
                styles.horizontalLine,
                isClaimed
                  ? {
                      height: 6,
                      backgroundColor: owner?.color || activePlayer.color,
                      borderRadius: 3,
                      shadowColor: owner?.color || activePlayer.color,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.35,
                      shadowRadius: 3,
                      elevation: 3,
                    }
                  : styles.faintGuideLineH,
              ]}
            />
          </TouchableOpacity>
        );
      }
    }
    return edges;
  };

  // Render Vertical Edges
  const renderVerticalEdges = () => {
    const edges = [];
    for (let r = 0; r < gridRows - 1; r++) {
      for (let c = 0; c < gridCols; c++) {
        const edgeKey = `v_${r}_${c}`;
        const claimedBy = state.verticalEdges[edgeKey];
        const isClaimed = Boolean(claimedBy);
        const owner = claimedBy ? playerMap.get(claimedBy) : null;

        edges.push(
          <TouchableOpacity
            key={edgeKey}
            activeOpacity={isClaimed ? 1 : 0.6}
            disabled={isClaimed || state.isGameOver}
            onPress={() => onClaimEdge('vertical', r, c)}
            style={[
              styles.verticalHitbox,
              {
                left: c * cellSize - hitThickness / 2,
                top: r * cellSize + dotRadius,
                width: hitThickness,
                height: cellSize - dotRadius * 2,
              },
            ]}
          >
            <View
              style={[
                styles.verticalLine,
                isClaimed
                  ? {
                      width: 6,
                      backgroundColor: owner?.color || activePlayer.color,
                      borderRadius: 3,
                      shadowColor: owner?.color || activePlayer.color,
                      shadowOffset: { width: 1, height: 0 },
                      shadowOpacity: 0.35,
                      shadowRadius: 3,
                      elevation: 3,
                    }
                  : styles.faintGuideLineV,
              ]}
            />
          </TouchableOpacity>
        );
      }
    }
    return edges;
  };

  // Render Dots
  const renderDots = () => {
    const dots = [];
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        dots.push(
          <View
            key={`dot_${r}_${c}`}
            pointerEvents="none"
            style={[
              styles.dot,
              {
                left: c * cellSize - dotRadius,
                top: r * cellSize - dotRadius,
                width: dotRadius * 2,
                height: dotRadius * 2,
                borderRadius: dotRadius,
              },
            ]}
          />
        );
      }
    }
    return dots;
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View
        style={[
          styles.boardSurface,
          {
            width: boardWidth + paddingH,
            height: boardHeight + paddingV,
          },
        ]}
      >
        <View
          style={[
            styles.boardContent,
            {
              width: boardWidth,
              height: boardHeight,
              marginLeft: paddingH / 2,
              marginTop: paddingV / 2,
            },
          ]}
        >
          {renderBoxes()}
          {renderHorizontalEdges()}
          {renderVerticalEdges()}
          {renderDots()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  boardSurface: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: THEME.paperBorder,
    shadowColor: THEME.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  boardContent: {
    position: 'relative',
  },
  boxCell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  stampCircle: {
    width: '64%',
    height: '64%',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampInitial: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  horizontalHitbox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  horizontalLine: {
    width: '100%',
  },
  faintGuideLineH: {
    height: 2,
    backgroundColor: '#DCD5C3',
    opacity: 0.75,
  },
  verticalHitbox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  verticalLine: {
    height: '100%',
  },
  faintGuideLineV: {
    width: 2,
    backgroundColor: '#DCD5C3',
    opacity: 0.75,
  },
  dot: {
    position: 'absolute',
    backgroundColor: THEME.charcoalDot,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
});
