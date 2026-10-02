import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SetupScreen } from './src/screens/SetupScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { Player } from './src/types/game';
import { THEME } from './src/constants/theme';
import { AdBanner } from './src/ads/AdBanner';

type Screen = 'setup' | 'game' | 'history';

interface ActiveGameConfig {
  rows: number;
  cols: number;
  players: Omit<Player, 'score'>[];
  allowUndo: boolean;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('setup');
  const [activeGame, setActiveGame] = useState<ActiveGameConfig | null>(null);
  const [lastSetup, setLastSetup] = useState<ActiveGameConfig | null>(null);

  const handleStartGame = (
    rows: number,
    cols: number,
    players: Omit<Player, 'score'>[],
    allowUndo: boolean
  ) => {
    const config = { rows, cols, players, allowUndo };
    setActiveGame(config);
    setLastSetup(config);
    setCurrentScreen('game');
  };

  const handleExitToMenu = () => {
    setActiveGame(null);
    setCurrentScreen('setup');
  };

  const handleOpenHistory = () => {
    setCurrentScreen('history');
  };

  const handleBackToSetup = () => {
    setCurrentScreen('setup');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          {currentScreen === 'setup' && (
            <>
              <SetupScreen
                onStartGame={handleStartGame}
                onOpenHistory={handleOpenHistory}
                lastSetup={lastSetup}
              />
              <AdBanner testMode={true} />
            </>
          )}

          {currentScreen === 'game' && activeGame && (
            <GameScreen
              gridRows={activeGame.rows}
              gridCols={activeGame.cols}
              players={activeGame.players}
              allowUndo={activeGame.allowUndo}
              onExitToMenu={handleExitToMenu}
              onOpenHistory={handleOpenHistory}
            />
          )}

          {currentScreen === 'history' && (
            <HistoryScreen onBack={handleBackToSetup} />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.paperBackground,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.paperBackground,
  },
});
