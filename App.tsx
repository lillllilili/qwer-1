
import React, { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import type { GameStatus } from './types';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('start');
  const [score, setScore] = useState(0);

  const startGame = useCallback(() => {
    setScore(0);
    setGameStatus('playing');
  }, []);

  const gameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setGameStatus('gameOver');
  }, []);

  const renderOverlay = () => {
    if (gameStatus === 'playing') return null;

    return (
      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center text-center backdrop-blur-sm z-10">
        <div className="bg-gray-800 bg-opacity-80 p-8 rounded-lg shadow-2xl border border-cyan-400/50">
          {gameStatus === 'start' && (
            <>
              <h1 className="text-5xl md:text-7xl font-bold text-cyan-400 tracking-widest uppercase">Geo Survivor</h1>
              <p className="mt-4 text-lg text-gray-300">Move with WASD. Aim and shoot with the mouse.</p>
              <button
                onClick={startGame}
                className="mt-8 px-8 py-4 bg-cyan-500 text-gray-900 font-bold text-xl rounded-lg hover:bg-cyan-400 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-cyan-500/30"
              >
                Start Game
              </button>
            </>
          )}
          {gameStatus === 'gameOver' && (
            <>
              <h1 className="text-6xl font-bold text-red-500 tracking-widest uppercase">Game Over</h1>
              <p className="mt-4 text-3xl text-gray-200">Final Score: <span className="font-bold text-yellow-400">{score}</span></p>
              <button
                onClick={startGame}
                className="mt-8 px-8 py-4 bg-yellow-500 text-gray-900 font-bold text-xl rounded-lg hover:bg-yellow-400 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-yellow-500/30"
              >
                Play Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-screen h-screen bg-gray-900 flex justify-center items-center font-mono">
      {renderOverlay()}
      {gameStatus === 'playing' && <GameCanvas onGameOver={gameOver} />}
    </div>
  );
};

export default App;
