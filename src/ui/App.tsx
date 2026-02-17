import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createGame } from '../game';
import { gameAPI } from '../game/api/GameCommandAPI';
import { GameStats, DEFAULT_STATS } from '../types/stats';
import { GameConfig, DEFAULT_CONFIG } from '../types/config';
import { ChatPanel } from './components/ChatPanel';
import { NarratorSidebar } from './components/NarratorSidebar';
import { StatusBar } from './components/StatusBar';
import { hfClient, narrator } from '../llm';
import './App.css';

const MAX_NARRATOR_MESSAGES = 20;

export const App: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [narratorMessages, setNarratorMessages] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [llmConfigured, setLlmConfigured] = useState(false);

  useEffect(() => {
    if (gameContainerRef.current && !gameRef.current) {
      gameRef.current = createGame(gameContainerRef.current);
    }

    gameAPI.onStatsChange((s) => setStats(s));
    gameAPI.onConfigChange((c) => setConfig(c));
    gameAPI.onNarratorSpeak((text) => {
      setNarratorMessages(prev => [...prev.slice(-MAX_NARRATOR_MESSAGES + 1), text]);
    });

    setLlmConfigured(hfClient.isConfigured());
    narrator.start('hype');

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      narrator.stop();
    };
  }, []);

  const handleToggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">BRICK BREAKER</h1>
        <StatusBar stats={stats} config={config} llmConfigured={llmConfigured} />
        <button className="chat-toggle" onClick={handleToggleChat}>
          {isChatOpen ? '✕ Close' : '🤖 AI Panel'}
        </button>
      </header>

      <main className="app-main">
        <NarratorSidebar messages={narratorMessages} />

        <div className="game-wrapper">
          <div ref={gameContainerRef} className="game-container" />
        </div>

        {isChatOpen && (
          <ChatPanel
            onClose={() => setIsChatOpen(false)}
            llmConfigured={llmConfigured}
            onKeySet={() => setLlmConfigured(hfClient.isConfigured())}
          />
        )}
      </main>
    </div>
  );
};
