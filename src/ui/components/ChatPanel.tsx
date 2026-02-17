import React, { useState, useRef, useEffect, useCallback } from 'react';
import { gameAPI } from '../../game/api/GameCommandAPI';
import { levelGenerator, configParser, narrator, hfClient } from '../../llm';
import type { NarratorPersonality } from '../../llm';

type ChatTab = 'config' | 'levels' | 'narrator';

interface ChatMessage {
  id: string;
  text: string;
  type: 'user' | 'system' | 'error' | 'success';
}

interface ChatPanelProps {
  onClose: () => void;
  llmConfigured: boolean;
  onKeySet: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onClose, llmConfigured, onKeySet }) => {
  const [activeTab, setActiveTab] = useState<ChatTab>('config');
  const [keyInput, setKeyInput] = useState('');
  const needsKey = !llmConfigured && !hfClient.envConfigured;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      text: llmConfigured
        ? 'AI connected! Type commands to modify the game.'
        : 'Enter your HuggingFace API key above to enable AI features, or play without them.',
      type: llmConfigured ? 'success' : 'system',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState<NarratorPersonality>('hype');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((text: string, type: ChatMessage['type']) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, type }]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userInput = input.trim();
    setInput('');
    addMessage(userInput, 'user');
    setIsLoading(true);

    try {
      switch (activeTab) {
        case 'config':
          await handleConfigCommand(userInput);
          break;
        case 'levels':
          await handleLevelCommand(userInput);
          break;
        case 'narrator':
          await handleNarratorCommand(userInput);
          break;
      }
    } catch (err) {
      addMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigCommand = async (input: string) => {
    addMessage('Parsing config change...', 'system');
    const result = await configParser.parse(input);

    if (result.success && result.patch) {
      const newConfig = gameAPI.applyConfig(result.patch);
      const changes = Object.entries(result.patch)
        .map(([section, values]) =>
          Object.entries(values as Record<string, unknown>)
            .map(([key, val]) => `${section}.${key} → ${val}`)
            .join(', ')
        )
        .join(', ');
      addMessage(`✓ Applied: ${changes}`, 'success');
      addMessage(`Ball speed: ${newConfig.ball.speed} | Paddle: ${newConfig.paddle.width}px | Lives: ${newConfig.gameplay.lives}`, 'system');
    } else {
      addMessage(`Could not parse: ${result.error}`, 'error');
    }
  };

  const handleLevelCommand = async (input: string) => {
    addMessage('Generating level...', 'system');
    const result = await levelGenerator.generate(input);

    if (result.success && result.level) {
      gameAPI.loadLevel(result.level);
      addMessage(
        `✓ Loaded "${result.level.name}" — ${result.level.bricks.length} bricks, ${result.level.gridCols}×${result.level.gridRows} grid`,
        'success'
      );
      if (result.level.description) {
        addMessage(result.level.description, 'system');
      }
    } else {
      addMessage(`Level generation failed: ${result.error}`, 'error');
    }
  };

  const handleNarratorCommand = async (input: string) => {
    // Check if it's a personality change
    const personalities = narrator.getAvailablePersonalities();
    const requested = input.toLowerCase().trim();
    const matchedPersonality = personalities.find(p => requested.includes(p));

    if (matchedPersonality) {
      narrator.setPersonality(matchedPersonality);
      setPersonality(matchedPersonality);
      addMessage(`✓ Narrator personality set to: ${matchedPersonality}`, 'success');
    } else {
      addMessage(`Available personalities: ${personalities.join(', ')}`, 'system');
      addMessage('Type a personality name to switch, or just play the game and the narrator will comment!', 'system');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlaceholder = (): string => {
    switch (activeTab) {
      case 'config': return 'e.g. "make the ball huge and slow"';
      case 'levels': return 'e.g. "a spiral of tough bricks"';
      case 'narrator': return 'e.g. "glados" or "pirate"';
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>🤖 AI Controls</h3>
        <button className="chat-toggle" onClick={onClose} style={{ padding: '4px 8px', fontSize: '11px' }}>✕</button>
      </div>

      {needsKey && (
        <div className="api-key-input">
          <label>HuggingFace API Key</label>
          <div className="api-key-row">
            <input
              className="chat-input"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="hf_..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && keyInput.trim()) {
                  hfClient.setApiKey(keyInput.trim());
                  onKeySet();
                  addMessage('✓ API key set for this session.', 'success');
                }
              }}
            />
            <button
              className="chat-send"
              disabled={!keyInput.trim()}
              onClick={() => {
                hfClient.setApiKey(keyInput.trim());
                onKeySet();
                addMessage('✓ API key set for this session.', 'success');
              }}
            >
              Set
            </button>
          </div>
          <span className="api-key-hint">Key is only stored in memory — never saved or transmitted elsewhere.</span>
        </div>
      )}

      <div className="chat-tabs">
        <button
          className={`chat-tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Config
        </button>
        <button
          className={`chat-tab ${activeTab === 'levels' ? 'active' : ''}`}
          onClick={() => setActiveTab('levels')}
        >
          🧱 Levels
        </button>
        <button
          className={`chat-tab ${activeTab === 'narrator' ? 'active' : ''}`}
          onClick={() => setActiveTab('narrator')}
        >
          🎙️ Narrator
        </button>
      </div>

      {activeTab === 'narrator' && (
        <div className="narrator-select">
          <label>Personality</label>
          <select
            value={personality}
            onChange={(e) => {
              const p = e.target.value as NarratorPersonality;
              setPersonality(p);
              narrator.setPersonality(p);
              addMessage(`✓ Narrator: ${p}`, 'success');
            }}
          >
            {narrator.getAvailablePersonalities().map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          disabled={isLoading}
        />
        <button
          className="chat-send"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? '...' : '→'}
        </button>
      </div>
    </div>
  );
};
