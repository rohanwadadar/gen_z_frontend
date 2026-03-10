import React, { useState, useCallback } from 'react';

/* ─── Rock Paper Scissors ──────────────────────────────────────────────── */
const RPS_OPTIONS = [
    { label: 'Rock', emoji: '🪨', beats: 'Scissors' },
    { label: 'Paper', emoji: '📄', beats: 'Rock' },
    { label: 'Scissors', emoji: '✂️', beats: 'Paper' },
];

const RockPaperScissors = ({ onResult }) => {
    const [chosen, setChosen] = useState(null);
    const [result, setResult] = useState(null);

    const play = (opt) => {
        const ai = RPS_OPTIONS[Math.floor(Math.random() * 3)];
        let outcome;
        if (opt.label === ai.label) outcome = "It's a Draw! 🤝";
        else if (opt.beats === ai.label) outcome = `You Win! ${opt.emoji} beats ${ai.emoji} 🎉`;
        else outcome = `You Lose! ${ai.emoji} beats ${opt.emoji} 💀`;
        setChosen(opt);
        setResult({ ai, outcome });
    };

    const handleSend = () => {
        if (!result) return;
        onResult({
            game: 'Rock Paper Scissors',
            gameIcon: '✂️',
            result: `${chosen.emoji} vs ${result.ai.emoji} — ${result.outcome}`,
        });
    };

    return (
        <div className="game-panel">
            <p className="game-title">Rock Paper Scissors ✂️</p>
            {!chosen ? (
                <div className="rps-grid">
                    {RPS_OPTIONS.map(o => (
                        <button key={o.label} onClick={() => play(o)} className="rps-btn">
                            <span className="rps-emoji">{o.emoji}</span>
                            <span>{o.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="game-result">
                    <div className="vs-row">
                        <div className="vs-item">
                            <span className="vs-emoji">{chosen.emoji}</span>
                            <span>You</span>
                        </div>
                        <span className="vs-label">VS</span>
                        <div className="vs-item">
                            <span className="vs-emoji">{result?.ai.emoji}</span>
                            <span>Bot</span>
                        </div>
                    </div>
                    <p className="outcome-text">{result?.outcome}</p>
                    <div className="game-actions">
                        <button onClick={() => { setChosen(null); setResult(null); }} className="btn btn-ghost" style={{ flex: 1, padding: '8px' }}>Retry 🔄</button>
                        <button onClick={handleSend} className="btn btn-blue" style={{ flex: 1, padding: '8px' }}>Send to Chat 📤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Coin Toss ────────────────────────────────────────────────────────── */
const CoinToss = ({ onResult }) => {
    const [flipping, setFlipping] = useState(false);
    const [result, setResult] = useState(null);

    const toss = () => {
        setFlipping(true);
        setResult(null);
        setTimeout(() => {
            const r = Math.random() < 0.5 ? 'Heads' : 'Tails';
            setResult(r);
            setFlipping(false);
        }, 1200);
    };

    return (
        <div className="game-panel">
            <p className="game-title">Coin Toss 🪙</p>
            <div className="coin-wrap">
                <div className={`coin ${flipping ? 'coin-flip' : ''} ${result ? (result === 'Heads' ? 'coin-heads' : 'coin-tails') : ''}`}>
                    {flipping ? '🪙' : result === 'Heads' ? '👑' : result === 'Tails' ? '🌟' : '🪙'}
                </div>
                {result && <p className="outcome-text">{result === 'Heads' ? '👑 Heads!' : '🌟 Tails!'}</p>}
            </div>
            <div className="game-actions">
                <button onClick={toss} disabled={flipping} className="btn btn-violet" style={{ flex: 1, padding: '8px' }}>
                    {flipping ? 'Flipping...' : '🪙 Toss!'}
                </button>
                {result && (
                    <button onClick={() => onResult({ game: 'Coin Toss', gameIcon: '🪙', result: `🪙 Result: ${result}! ${result === 'Heads' ? '👑' : '🌟'}` })} className="btn btn-blue" style={{ flex: 1, padding: '8px' }}>
                        Send 📤
                    </button>
                )}
            </div>
        </div>
    );
};

/* ─── Ludo Dice ────────────────────────────────────────────────────────── */
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const LudoDice = ({ onResult }) => {
    const [rolling, setRolling] = useState(false);
    const [value, setValue] = useState(null);
    const [display, setDisplay] = useState('🎲');

    const roll = () => {
        setRolling(true);
        let count = 0;
        const interval = setInterval(() => {
            setDisplay(DICE_FACES[Math.floor(Math.random() * 6)]);
            count++;
            if (count > 10) {
                clearInterval(interval);
                const v = Math.floor(Math.random() * 6) + 1;
                setValue(v);
                setDisplay(DICE_FACES[v - 1]);
                setRolling(false);
            }
        }, 80);
    };

    return (
        <div className="game-panel">
            <p className="game-title">Ludo Dice 🎲</p>
            <div className="dice-wrap">
                <div className={`dice-face ${rolling ? 'dice-rolling' : ''}`}>{display}</div>
                {value && !rolling && <p className="outcome-text">You rolled a {value}! {value === 6 ? '🎉 Six, bestie!' : value === 1 ? '😬 One...' : ''}</p>}
            </div>
            <div className="game-actions">
                <button onClick={roll} disabled={rolling} className="btn btn-gold" style={{ flex: 1, padding: '8px' }}>
                    {rolling ? 'Rolling...' : '🎲 Roll!'}
                </button>
                {value && !rolling && (
                    <button onClick={() => onResult({ game: 'Ludo Dice', gameIcon: '🎲', result: `🎲 Rolled ${DICE_FACES[value - 1]} (${value})! ${value === 6 ? '🎉 Six!' : ''}` })} className="btn btn-blue" style={{ flex: 1, padding: '8px' }}>
                        Send 📤
                    </button>
                )}
            </div>
        </div>
    );
};

/* ─── Tic Tac Toe ──────────────────────────────────────────────────────── */
const checkWinner = (squares) => {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const [a, b, c] of lines) {
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    if (squares.every(Boolean)) return 'Draw';
    return null;
};

const TicTacToe = ({ onResult }) => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const winner = checkWinner(board);

    const click = (i) => {
        if (board[i] || winner) return;
        const next = [...board];
        next[i] = xIsNext ? 'X' : 'O';
        setBoard(next);
        setXIsNext(!xIsNext);
    };

    const reset = () => { setBoard(Array(9).fill(null)); setXIsNext(true); };

    const statusText = winner
        ? winner === 'Draw' ? "It's a Draw! 🤝" : `${winner} Wins! 🎉`
        : `${xIsNext ? 'X' : 'O'}'s turn`;

    const sendResult = () => {
        const res = winner === 'Draw' ? "Tic Tac Toe — It's a Draw! 🤝"
            : `Tic Tac Toe — ${winner} Wins! 🎉`;
        onResult({ game: 'Tic Tac Toe', gameIcon: '⭕', result: res });
    };

    return (
        <div className="game-panel">
            <p className="game-title">Tic Tac Toe ⭕❌</p>
            <p className="ttt-status">{statusText}</p>
            <div className="ttt-grid">
                {board.map((cell, i) => (
                    <button key={i} onClick={() => click(i)} className={`ttt-cell ${cell === 'X' ? 'ttt-x' : cell === 'O' ? 'ttt-o' : ''}`}>
                        {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : ''}
                    </button>
                ))}
            </div>
            <div className="game-actions">
                <button onClick={reset} className="btn btn-ghost" style={{ flex: 1, padding: '8px' }}>Reset 🔄</button>
                {winner && <button onClick={sendResult} className="btn btn-blue" style={{ flex: 1, padding: '8px' }}>Send Result 📤</button>}
            </div>
        </div>
    );
};

/* ─── Random Guess (1-6) ───────────────────────────────────────────────── */
const RandomGuess = ({ onResult }) => {
    const [guess, setGuess] = useState(null);
    const [result, setResult] = useState(null);

    const play = (g) => {
        const r = Math.floor(Math.random() * 6) + 1;
        const win = g === r;
        setGuess(g);
        setResult({ rolled: r, win });
    };

    return (
        <div className="game-panel">
            <p className="game-title">Guess 1-6 🎯</p>
            <p className="game-sub">Pick a number — we'll roll for you!</p>
            {!result ? (
                <div className="guess-grid">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <button key={n} onClick={() => play(n)} className="guess-btn">{n}</button>
                    ))}
                </div>
            ) : (
                <div className="game-result">
                    <div className="vs-row">
                        <div className="vs-item"><span className="vs-emoji">{guess}</span><span>Your Guess</span></div>
                        <span className="vs-label">VS</span>
                        <div className="vs-item"><span className="vs-emoji">{result.rolled}</span><span>Rolled</span></div>
                    </div>
                    <p className="outcome-text">{result.win ? '🎯 Exact Match! You nailed it!' : `${Math.abs(guess - result.rolled)} off. ${result.rolled > guess ? 'Too low!' : 'Too high!'}`}</p>
                    <div className="game-actions">
                        <button onClick={() => { setGuess(null); setResult(null); }} className="btn btn-ghost" style={{ flex: 1, padding: '8px' }}>Retry 🔄</button>
                        <button onClick={() => onResult({ game: 'Random Guess', gameIcon: '🎯', result: `🎯 Guessed ${guess}, Rolled ${result.rolled} — ${result.win ? 'EXACT HIT! 🏆' : `${Math.abs(guess - result.rolled)} off 😬`}` })} className="btn btn-blue" style={{ flex: 1, padding: '8px' }}>Send 📤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Mini Games Container ─────────────────────────────────────────────── */
const GAMES = [
    { id: 'rps', label: 'Rock Paper Scissors', emoji: '✂️' },
    { id: 'coin', label: 'Coin Toss', emoji: '🪙' },
    { id: 'dice', label: 'Ludo Dice', emoji: '🎲' },
    { id: 'ttt', label: 'Tic Tac Toe', emoji: '⭕' },
    { id: 'guess', label: 'Guess 1-6', emoji: '🎯' },
];

const MiniGames = ({ onSendResult, onClose }) => {
    const [activeGame, setActiveGame] = useState(null);

    return (
        <div className="games-panel anim-fade-up">
            <div className="games-header">
                <span className="games-title">🎮 Mini Games</span>
                <button onClick={onClose} className="games-close">✕</button>
            </div>

            {!activeGame ? (
                <div className="games-list">
                    {GAMES.map(g => (
                        <button key={g.id} onClick={() => setActiveGame(g.id)} className="game-select-btn">
                            <span className="game-select-emoji">{g.emoji}</span>
                            <span className="game-select-label">{g.label}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    ))}
                </div>
            ) : (
                <div>
                    <button onClick={() => setActiveGame(null)} className="game-back-btn">← Back to Games</button>
                    {activeGame === 'rps' && <RockPaperScissors onResult={onSendResult} />}
                    {activeGame === 'coin' && <CoinToss onResult={onSendResult} />}
                    {activeGame === 'dice' && <LudoDice onResult={onSendResult} />}
                    {activeGame === 'ttt' && <TicTacToe onResult={onSendResult} />}
                    {activeGame === 'guess' && <RandomGuess onResult={onSendResult} />}
                </div>
            )}
        </div>
    );
};

export default MiniGames;
