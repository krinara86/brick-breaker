import React, { useMemo } from 'react';
import { GameStats } from '../../types/stats';
import { GameConfig } from '../../types/config';
import { highScores } from '../../game/highscores';

interface StatusBarProps {
  stats: GameStats;
  config: GameConfig;
  llmConfigured: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ stats, llmConfigured }) => {
  const topScore = useMemo(() => highScores.getTopScore(), []);

  return (
    <div className="status-bar">
      <div className="status-item">
        <span>Score:</span>
        <span className="status-value">{stats.score}</span>
      </div>
      {topScore > 0 && (
        <div className="status-item">
          <span>Best:</span>
          <span className="status-value" style={{ color: stats.score > topScore ? '#f59e0b' : undefined }}>
            {topScore}
          </span>
        </div>
      )}
      <div className="status-item">
        <span>Level:</span>
        <span className="status-value">{stats.level}</span>
      </div>
      <div className="status-item">
        <span>Combo:</span>
        <span className="status-value">{stats.maxCombo}x</span>
      </div>
      <div className="status-item">
        <span className={`llm-indicator ${llmConfigured ? 'llm-on' : 'llm-off'}`} />
        <span>{llmConfigured ? 'AI ON' : 'AI OFF'}</span>
      </div>
    </div>
  );
};
