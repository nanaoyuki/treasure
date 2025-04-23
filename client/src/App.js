import React, { useEffect, useState } from 'react';
import socket from './socket.js';
import './App.css';

function App() {
  const [log, setLog] = useState([]);
  const [joined, setJoined] = useState(false);
  const [matched, setMatched] = useState(false);
  const [treasurePlaced, setTreasurePlaced] = useState(false);
  const [myGrid, setMyGrid] = useState(Array(25).fill(null));
  const [opponentGrid, setOpponentGrid] = useState(Array(25).fill(null));
  const [selectedCell, setSelectedCell] = useState(null);
  const [myTurn, setMyTurn] = useState(false);
  const roomId = 'room1';

  useEffect(() => {
    socket.on('connect', () => {
      setLog(prev => [...prev, `✅ 接続: ${socket.id}`]);
    });

    socket.on('player-joined', (id) => {
      setMatched(true);
      setLog(prev => [...prev, `🎉 マッチングしました! 相手: ${id}`]);
    });

    socket.on('start-game', ({ firstPlayerId }) => {
      setMyTurn(firstPlayerId === socket.id);
      setLog(prev => [...prev, `🎮 ゲーム開始! ${firstPlayerId === socket.id ? 'あなたが先攻です。' : '相手が先攻です。'}`]);
    });

    socket.on('opponent-move', (cell) => {
      setLog(prev => [...prev, `🔎 相手があなたのマス ${cell} を開けました。`]);
      setMyGrid(prev => {
        const newGrid = [...prev];
        newGrid[cell] = 'X';
        return newGrid;
      });
      setMyTurn(true);
    });

    socket.on('hit', (cell) => {
      setLog(prev => [...prev, `🎯 宝箱を発見！`]);
      setOpponentGrid(prev => {
        const newGrid = [...prev];
        newGrid[cell] = '💎';
        return newGrid;
      });
    });

    socket.on('game-over', (winnerId) => {
      if (winnerId === socket.id) {
        setLog(prev => [...prev, '🏆 あなたの勝ちです！']);
      } else {
        setLog(prev => [...prev, '💥 負けてしまいました。']);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('player-joined');
      socket.off('start-game');
      socket.off('opponent-move');
      socket.off('hit');
      socket.off('game-over');
    };
  }, []);

  const joinRoom = () => {
    socket.emit('join-room', roomId);
    setJoined(true);
    setLog(prev => [...prev, '🔍 対戦相手を探しています…']);
  };

  const placeTreasure = () => {
    if (selectedCell !== null) {
      socket.emit('place-treasure', { roomId, cell: selectedCell });
      setTreasurePlaced(true);
      setLog(prev => [...prev, `📦 宝箱をマス ${selectedCell} に隠しました。`]);
    }
  };

  const handleCellClick = (index) => {
    if (!myTurn || !matched || !treasurePlaced || opponentGrid[index]) return;

    socket.emit('make-move', { roomId, cell: index });
    setOpponentGrid(prev => {
      const newGrid = [...prev];
      newGrid[index] = '?';
      return newGrid;
    });
    setMyTurn(false);
  };

  const handleTreasureSelect = (index) => {
    if (!treasurePlaced) {
      setSelectedCell(index);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🪙 Treasure Hunt</h1>

      {!joined && (
        <button onClick={joinRoom}>🔍 対戦相手を探す</button>
      )}

      {joined && !matched && <p>🔄 対戦相手を探しています…</p>}

      {matched && !treasurePlaced && (
        <>
          <p>📦 宝箱を隠すマスを選んでください</p>
          <div className="grid">
            {myGrid.map((mark, idx) => (
              <div
                key={idx}
                className={`cell ${selectedCell === idx ? 'selected' : ''}`}
                onClick={() => handleTreasureSelect(idx)}
              >
                {selectedCell === idx ? '📦' : ''}
              </div>
            ))}
          </div>
          <button onClick={placeTreasure}>✅ 決定</button>
        </>
      )}

      {matched && treasurePlaced && (
        <>
          <p>{myTurn ? '🕹 あなたのターン' : '⏳ 相手のターン'}</p>
          <h3>相手の盤面</h3>
          <div className="grid">
            {opponentGrid.map((mark, idx) => (
              <div
                key={idx}
                className={`cell ${mark ? 'opened' : ''}`}
                onClick={() => handleCellClick(idx)}
              >
                {mark === '💎' ? '💎' : ''}
              </div>
            ))}
          </div>
        </>
      )}

      <h3>ログ：</h3>
      <ul>
        {log.map((entry, idx) => (
          <li key={idx}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
