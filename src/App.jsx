import React, { useState, useEffect, useRef, useCallback } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { socket } from './socket';
import MiniGames from './MiniGames';
import { sounds } from './sounds';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtLastSeen = (ts) => {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
};
const encodeMeeting = (m) => `__MTG__${JSON.stringify(m)}`;
const parseMeeting = (c) => { if (!c?.startsWith('__MTG__')) return null; try { return JSON.parse(c.slice(7)); } catch { return null; } };
const isImgMsg = (c) => c?.startsWith('__IMG__');
const isGameMsg = (c) => c?.startsWith('__GAME__');

/* ─── Notification helpers ────────────────────────────────────────────────── */
const requestNotifPermission = () => { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); };
const sendBrowserNotif = (title, body) => { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/favicon.ico' }); };

/* ─── Dark Mode ───────────────────────────────────────────────────────────── */
const applyTheme = (dark) => document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

/* ─── Gen Z Slang ─────────────────────────────────────────────────────────── */
const genZSlang = [
  { term: "Rizz", desc: "Charisma or charm", emoji: "🥶" },
  { term: "No Cap", desc: "No lie; telling the truth", emoji: "🧢" },
  { term: "Bet", desc: "Yes, I agree", emoji: "🤝" },
  { term: "Slay", desc: "To do exceptionally well", emoji: "💅" },
  { term: "Bussin", desc: "Extremely good (usually food)", emoji: "🤤" },
  { term: "Delulu", desc: "Delusional, in a humorous way", emoji: "🤡" },
  { term: "Sheesh", desc: "Hype or surprise", emoji: "🥶" },
  { term: "Mid", desc: "Mediocre or average", emoji: "😐" },
  { term: "Based", desc: "Being yourself unashamedly", emoji: "🗿" },
  { term: "GOAT", desc: "Greatest Of All Time", emoji: "🐐" },
  { term: "FOMO", desc: "Fear Of Missing Out", emoji: "😰" },
  { term: "Ghosting", desc: "Suddenly stopping communication", emoji: "👻" },
  { term: "Fire", desc: "Exciting or excellent", emoji: "🔥" },
  { term: "Yeet", desc: "Throwing something forcefully", emoji: "🚀" },
  { term: "Simp", desc: "Shows excessive affection", emoji: "🥺" },
].sort((a, b) => a.term.localeCompare(b.term));

/* ─── Toast Stack ────────────────────────────────────────────────────────── */
const Toast = ({ toasts }) => (
  <div className="toast-stack">
    {toasts.map(t => (
      <div key={t.id} className={`nx-toast toast-${t.type}`}>
        <span>{t.type === 'err' ? '❌' : t.type === 'notif' ? '💬' : 'ℹ️'}</span>
        <p>{t.msg}</p>
      </div>
    ))}
  </div>
);

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const Avatar = ({ email, size = 40, variant = 'blue', online, status }) => {
  const gradient = variant === 'violet' ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
    : variant === 'gold' ? 'linear-gradient(135deg,#d97706,#fbbf24)'
      : 'linear-gradient(135deg,#2563eb,#60a5fa)';
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: gradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: size * 0.4, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
        {email?.[0]?.toUpperCase() ?? '?'}
      </div>
      {online !== undefined && (
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: '50%', background: online ? '#22c55e' : '#94a3b8', border: '2px solid var(--surface)', display: 'block' }} />
      )}
      {status?.emoji && (
        <span style={{ position: 'absolute', top: -4, right: -4, fontSize: size * 0.32 }}>{status.emoji}</span>
      )}
    </div>
  );
};

/* ─── Online Status Label ─────────────────────────────────────────────────── */
const StatusLabel = ({ online, lastSeen, status }) => (
  <p style={{ fontSize: 11, color: online ? '#22c55e' : 'var(--text-400)', fontWeight: 700 }}>
    {status?.text ? `${status.text}` : online ? '● Online' : lastSeen ? `Last seen ${fmtLastSeen(lastSeen)}` : '○ Offline'}
  </p>
);

/* ─── Custom Tag Select ───────────────────────────────────────────────────── */
const TagSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const opts = [
    { val: '', label: 'Tag...', emoji: '🏷️' },
    { val: 'Bestie 🤞', label: 'Bestie', emoji: '🤞' },
    { val: 'Squad 💯', label: 'Squad', emoji: '💯' },
    { val: 'Tea ☕', label: 'Tea', emoji: '☕' },
    { val: 'W Rizz 🥶', label: 'W Rizz', emoji: '🥶' },
    { val: 'Delulu 🤡', label: 'Delulu', emoji: '🤡' },
  ];
  const sel = opts.find(o => o.val === value) || opts[0];
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} className="tag-select-btn">
        <span>{sel.emoji}</span><span className="tag-select-label">{sel.label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M1 3l4 4 4-4" /></svg>
      </button>
      {open && (
        <div className="tag-dropdown">
          {opts.map(o => (
            <button key={o.val} type="button" onClick={() => { onChange(o.val); setOpen(false); sounds.pop(); }}
              className={`tag-option ${value === o.val ? 'tag-option-active' : ''}`}>
              <span>{o.emoji}</span><span>{o.label}</span>
              {value === o.val && <span style={{ marginLeft: 'auto', color: '#6366f1' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Status Mood Picker ──────────────────────────────────────────────────── */
const MOODS = [
  { emoji: '🎧', text: 'Vibing' }, { emoji: '😴', text: 'AFK' }, { emoji: '🔥', text: 'On fire' },
  { emoji: '🧠', text: 'Big brain' }, { emoji: '🤡', text: 'clownin' }, { emoji: '💀', text: 'Sending me' },
  { emoji: '✨', text: 'Slay' }, { emoji: '🚀', text: 'Yeeting' }, { emoji: '😬', text: 'Mid day' },
  { emoji: '🏆', text: 'W mode' },
];
const MoodPicker = ({ current, onSet, onClear, onClose }) => (
  <div className="mood-picker anim-scale-in">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontWeight: 800, fontSize: 13 }}>Set Your Vibe</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-400)' }}>✕</button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
      {MOODS.map(m => (
        <button key={m.emoji} onClick={() => { onSet(m); onClose(); sounds.pop(); }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px', border: current?.emoji === m.emoji ? '2px solid #6366f1' : '2px solid transparent', borderRadius: 10, background: current?.emoji === m.emoji ? 'var(--violet-50)' : 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: 'var(--text-500)' }}>
          <span style={{ fontSize: 22 }}>{m.emoji}</span>{m.text}
        </button>
      ))}
    </div>
    {current && <button onClick={() => { onClear(); onClose(); }} style={{ marginTop: 10, width: '100%', background: 'none', border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text-400)' }}>Clear Status</button>}
  </div>
);

/* ─── Slang Picker ────────────────────────────────────────────────────────── */
const SlangPicker = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const filtered = genZSlang.filter(s => s.term.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="slang-picker anim-fade-up">
      <div className="slang-header"><span>Gen Z Dictionary 📖</span><button onClick={onClose} className="slang-close">✕</button></div>
      <input autoFocus type="text" className="nx-input" placeholder="Search slang..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 12px', fontSize: 13, margin: '0 0 0 0' }} />
      <div className="slang-list">
        {filtered.length === 0 && <p className="slang-empty">No cap, couldn't find that 🧢</p>}
        {filtered.map(s => (
          <button key={s.term} type="button" onClick={() => { onSelect(`${s.term} ${s.emoji}`); onClose(); sounds.pop(); }} className="slang-item">
            <div><p className="slang-term">{s.term}</p><p className="slang-desc">{s.desc}</p></div>
            <span>{s.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Meeting Card ────────────────────────────────────────────────────────── */
const MeetingCard = ({ meeting }) => {
  const mt = new Date(meeting.time);
  return (
    <div className="meeting-card">
      <div className="meeting-header">📅 <span>MEETING INVITE</span></div>
      <p className="meeting-title">{meeting.title}</p>
      <p className="meeting-time">🕐 {mt.toLocaleDateString()} at {mt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      {meeting.link && <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={{ padding: '6px 10px', fontSize: 11, marginTop: 8, display: 'block', textAlign: 'center' }}>Join Meet</a>}
    </div>
  );
};

/* ─── Schedule Modal ──────────────────────────────────────────────────────── */
const ScheduleModal = ({ onSend, onClose }) => {
  const [title, setTitle] = useState(''); const [dt, setDt] = useState(''); const [link, setLink] = useState('');
  return (
    <div className="modal-backdrop">
      <div className="modal-card anim-scale-in">
        <h3 style={{ marginBottom: 16, fontWeight: 800 }}>Schedule Meeting 📅</h3>
        <label className="section-label">Title</label>
        <input type="text" className="nx-input" style={{ marginBottom: 12 }} value={title} onChange={e => setTitle(e.target.value)} placeholder="Team Sync" />
        <label className="section-label">Date & Time</label>
        <input type="datetime-local" className="nx-input" style={{ marginBottom: 12 }} value={dt} onChange={e => setDt(e.target.value)} />
        <label className="section-label">Google Meet Link</label>
        <input type="url" className="nx-input" style={{ marginBottom: 20 }} value={link} onChange={e => setLink(e.target.value)} placeholder="https://meet.google.com/..." />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { onSend({ title, time: dt, link }); onClose(); }} className="btn btn-blue" style={{ flex: 1 }}>Send</button>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Message Reactions Row ───────────────────────────────────────────────── */
const QUICK_REACT = ['❤️', '😂', '🔥', '💀', '👑', '🥶'];
const ReactionsRow = ({ reactions, onReact, myEmail, reactions_by }) => {
  if (!reactions || Object.keys(reactions).length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {Object.entries(reactions).map(([emoji, count]) => (
        <button key={emoji} onClick={() => onReact(emoji)}
          style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 999, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: 13, cursor: 'pointer', fontWeight: 700, color: 'var(--text-700)', transition: 'all 0.15s' }}>
          {emoji}<span style={{ fontSize: 11 }}>{count}</span>
        </button>
      ))}
    </div>
  );
};

/* ─── Reply Preview Bar ───────────────────────────────────────────────────── */
const ReplyBar = ({ replyTo, onCancel }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--violet-50)', borderRadius: '10px 10px 0 0', borderLeft: '3px solid #6366f1', marginBottom: 2 }}>
    <span style={{ fontSize: 12, flex: 1, color: 'var(--text-700)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      ↩ <strong>{replyTo.sender_email?.split('@')[0]}</strong>: {isGameMsg(replyTo.message_content) ? '🎮 Game Result' : isImgMsg(replyTo.message_content) ? '🖼 Image' : replyTo.message_content?.slice(0, 60)}
    </span>
    <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-400)', fontSize: 14 }}>✕</button>
  </div>
);

/* ─── Message Bubble with Swipe-to-Reply ─────────────────────────────────── */
const EMOJI_REACTIONS = QUICK_REACT;
const MessageBubble = ({ m, isMe, onDelete, onReact, onReply, allMessages, isLast, readStatus }) => {
  const [showDelete, setShowDelete] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(null);
  const swipeTriggered = useRef(false);
  const dragging = useRef(false);

  const mtg = parseMeeting(m.message_content);
  const isImg = isImgMsg(m.message_content);
  const isGame = isGameMsg(m.message_content);
  let gameResult = null;
  if (isGame) { try { gameResult = JSON.parse(m.message_content.slice(8)); } catch { } }
  const replyMsg = m.reply_to ? allMessages.find(x => x.id === m.reply_to) : null;

  // ── Touch (mobile swipe right to reply)
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; swipeTriggered.current = false; };
  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx > 0 && dx < 85) setSwipeX(dx);
  };
  const onTouchEnd = () => {
    if (swipeX > 55 && !swipeTriggered.current) { swipeTriggered.current = true; onReply(m); sounds.pop(); }
    setSwipeX(0); touchStartX.current = null;
  };

  // ── Mouse (desktop drag right to reply)
  const onMouseDown = (e) => { dragging.current = true; touchStartX.current = e.clientX; swipeTriggered.current = false; };
  const onMouseMove = (e) => {
    if (!dragging.current || touchStartX.current === null) return;
    const dx = e.clientX - touchStartX.current;
    if (dx > 0 && dx < 85) setSwipeX(dx);
  };
  const onMouseUp = () => {
    if (swipeX > 55 && !swipeTriggered.current) { swipeTriggered.current = true; onReply(m); sounds.pop(); }
    setSwipeX(0); dragging.current = false; touchStartX.current = null;
  };

  const swipeProgress = Math.min(swipeX / 55, 1);
  const isTransitioning = swipeX === 0;

  return (
    <div className={`msg-row ${isMe ? 'msg-row-me' : 'msg-row-them'}`} onMouseLeave={onMouseUp}>
      {/* Swipe arrow indicator */}
      <div className="swipe-reply-arrow" style={{
        opacity: swipeX > 8 ? swipeProgress : 0,
        transform: `scale(${0.4 + swipeProgress * 0.6}) translateX(${isMe ? '0' : '-8px'})`,
        order: isMe ? 1 : -1,
      }}>↩</div>

      <div className="msg-wrapper"
        style={{ transform: `translateX(${swipeX}px)`, transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' : 'none', userSelect: 'none' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>

        {/* Quick react strip on hover */}
        <div className={`react-strip ${isMe ? 'react-strip-me' : 'react-strip-them'}`}>
          {EMOJI_REACTIONS.map(e => (
            <button key={e} onClick={() => { onReact(m.id, e); sounds.pop(); }} className="react-quick-btn">{e}</button>
          ))}
          <button onClick={() => { onReply(m); sounds.pop(); }} className="react-quick-btn" title="Reply">↩</button>
        </div>

        {/* Reply quote */}
        {replyMsg && (
          <div className={`reply-quote ${isMe ? 'reply-quote-me' : 'reply-quote-them'}`}>
            <span style={{ fontWeight: 700, fontSize: 10, opacity: 0.7 }}>{replyMsg.sender_email?.split('@')[0]}</span>
            <span style={{ fontSize: 11, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {isGameMsg(replyMsg.message_content) ? '🎮 Game Result' : isImgMsg(replyMsg.message_content) ? '🖼 Image' : replyMsg.message_content?.slice(0, 50)}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div className={isMe ? 'bubble-me' : 'bubble-them'}
          onClick={() => isMe && setShowDelete(d => !d)}
          onContextMenu={e => { e.preventDefault(); onReply(m); }}>
          {mtg && <MeetingCard meeting={mtg} />}
          {isImg && <img src={m.message_content.slice(7)} alt="shared" style={{ maxWidth: 200, borderRadius: 8 }} />}
          {isGame && gameResult && (
            <div className="game-result-bubble">
              <span style={{ fontSize: 24 }}>{gameResult.gameIcon}</span>
              <div><p className="game-result-title">{gameResult.game}</p><p className="game-result-text">{gameResult.result}</p></div>
            </div>
          )}
          {!mtg && !isImg && !isGame && <p style={{ fontSize: 14, lineHeight: 1.5 }}>{m.message_content}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 4, marginTop: 4 }}>
            <span className="msg-time">{fmtTime(m.created_at)}</span>
            {/* Read receipt ticks — only on last sent message */}
            {isMe && isLast && (
              <span className={`msg-tick msg-tick-${readStatus}`} title={readStatus === 'seen' ? 'Seen' : readStatus === 'delivered' ? 'Delivered' : 'Sent'}>
                {readStatus === 'seen' ? '✓✓' : readStatus === 'delivered' ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        <ReactionsRow reactions={m.reactions} onReact={e => { onReact(m.id, e); sounds.pop(); }} />

        {/* Delete tab */}
        {isMe && showDelete && (
          <button className="delete-tab" onClick={e => { e.stopPropagation(); onDelete(m.id); setShowDelete(false); sounds.pop(); }}>
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Chat Wallpaper ──────────────────────────────────────────────────────── */
const ChatWallpaper = () => (
  <div className="chat-wallpaper" aria-hidden="true">
    <svg className="wallpaper-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      {[...Array(12)].map((_, i) => (
        <text key={i} x={`${8 + i * 8}%`} y={`${10 + (i * 7) % 80}%`}
          fontSize={i % 3 === 0 ? 22 : 14} opacity="0.1" className={`wp-float-${(i % 3) + 1}`}>
          {['✨', '⭐', '💫', '🌟', '🔥', '💎', '👑', '🌈', '🎯', '⚡', '🦋', '🎪'][i]}
        </text>
      ))}
      {[...Array(8)].map((_, row) => [...Array(10)].map((_, col) => (
        <circle key={`d-${row}-${col}`} cx={col * 90 + 40} cy={row * 80 + 40} r="1.5" fill="#6366f1" opacity="0.06" />
      )))}
      <circle cx="100" cy="100" r="60" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.06" className="wp-spin" />
      <circle cx="700" cy="500" r="90" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.06" className="wp-spin-rev" />
    </svg>
  </div>
);

/* ─── Share Modal ──────────────────────────────────────────────────── */
const PAGE_URL = 'https://gen-z-frontend-theta.vercel.app';
const microlinkUrl = (url) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&embed=screenshot.url&waitFor=3000&meta=false`;

const ShareModal = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const previewUrl = microlinkUrl(PAGE_URL);

  const copy = () => {
    navigator.clipboard.writeText(PAGE_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    sounds.pop();
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title: 'z-chatt • no cap messaging fr fr ✨', text: 'The main character energy messaging hub 🔥', url: PAGE_URL });
    } else { copy(); }
    sounds.pop();
  };

  const whatsapp = () => { window.open(`https://wa.me/?text=${encodeURIComponent('✨ z-chatt • the main character energy hub fr fr 🔥 ' + PAGE_URL)}`, '_blank'); sounds.pop(); };
  const twitter = () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('✨ z-chatt • no cap messaging fr fr 🔥')}&url=${encodeURIComponent(PAGE_URL)}`, '_blank'); sounds.pop(); };

  return (
    <div className="modal-backdrop">
      <div className="share-card anim-scale-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 900, fontSize: 18 }}>Share z-chatt 🚀</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-400)' }}>✕</button>
        </div>

        {/* Live Microlink preview */}
        {!imgLoaded && <div className="share-preview-loading" />}
        <img
          src={previewUrl}
          alt="z-chatt preview"
          className="share-preview"
          style={{ display: imgLoaded ? 'block' : 'none' }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
        />

        {/* URL row */}
        <div className="share-url-row">
          <span className="share-url-text">{PAGE_URL}</span>
          <button onClick={copy} className="btn btn-blue" style={{ padding: '5px 12px', fontSize: 12 }}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="share-btns">
          <button className="share-btn" onClick={shareNative}><span>📤</span> Share</button>
          <button className="share-btn" onClick={whatsapp}><span>💬</span> WhatsApp</button>
          <button className="share-btn" onClick={twitter}><span>🐦</span> Twitter</button>
          <button className="share-btn" onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(PAGE_URL)}`, '_blank'); sounds.pop(); }}><span>🌐</span> Facebook</button>
        </div>
      </div>
    </div>
  );
};

/* ─── App Root ────────────────────────────────────────────────────────────── */
const App = () => {
  const [platform, setPlatform] = useState('desktop');
  const [user, setUser] = useState(() => { try { const s = localStorage.getItem('nexus_user'); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [authMode, setAuthMode] = useState('login');
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [toasts, setToasts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [dashboardData, setDashboardData] = useState({ incoming: [], outgoing: [], accepted: [] });
  const [onlineMap, setOnlineMap] = useState({});     // peer email → { online, lastSeen, status }
  const [peerStatus, setPeerStatus] = useState(null); // current chat peer status
  const [messages, setMessages] = useState([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [showSlang, setShowSlang] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [replyTo, setReplyTo] = useState(null);       // message to reply to
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('nexus_theme') === 'dark');
  const [dnd, setDnd] = useState(() => localStorage.getItem('nexus_dnd') === 'true');
  const [myStatus, setMyStatus] = useState(() => { try { return JSON.parse(localStorage.getItem('nexus_status')); } catch { return null; } });
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [chatTags, setChatTags] = useState(() => JSON.parse(localStorage.getItem('nexus_tags') || '{}'));
  const [readBy, setReadBy] = useState(false);
  const [peerInRoom, setPeerInRoom] = useState(false);
  const [showFunPanel, setShowFunPanel] = useState(false);
  const [ghostWarning, setGhostWarning] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [appearOffline, setAppearOffline] = useState(false); // user appears offline to peers

  const endRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://gen-z-backend-ujq7.onrender.com';

  // Apply theme on dark mode change
  useEffect(() => { applyTheme(darkMode); localStorage.setItem('nexus_theme', darkMode ? 'dark' : 'light'); }, [darkMode]);
  useEffect(() => { localStorage.setItem('nexus_dnd', dnd); }, [dnd]);
  useEffect(() => { if (user) localStorage.setItem('nexus_user', JSON.stringify(user)); else localStorage.removeItem('nexus_user'); }, [user]);
  useEffect(() => { localStorage.setItem('nexus_tags', JSON.stringify(chatTags)); }, [chatTags]);
  useEffect(() => { localStorage.setItem('nexus_status', JSON.stringify(myStatus)); }, [myStatus]);
  useEffect(() => { const ua = navigator.userAgent; if (/android/i.test(ua)) setPlatform('android'); else if (/iPad|iPhone|iPod/.test(ua)) setPlatform('ios'); else if (/mobile/i.test(ua)) setPlatform('mobile'); else setPlatform('desktop'); }, []);
  useEffect(() => { requestNotifPermission(); }, []);

  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p.slice(-3), { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // Socket
  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit('user_online', { email: user.email });

    socket.on('dashboard_data', d => {
      setDashboardData({ incoming: d.incomingRequests, outgoing: d.outgoingRequests, accepted: d.acceptedChats });
      setOnlineMap(d.onlineMap || {});
    });
    socket.on('incoming_chat_request', r => {
      setDashboardData(p => ({ ...p, incoming: [r, ...p.incoming] }));
      if (!dnd) { showToast(`${r.requester_email.split('@')[0]} wants to chat!`, 'notif'); sounds.notification(); sendBrowserNotif('New Chat Request', `${r.requester_email} sent you a chat request`); }
    });
    socket.on('chat_request_accepted', c => {
      setDashboardData(p => ({ ...p, accepted: [c, ...p.accepted], incoming: p.incoming.filter(r => r.id !== c.id), outgoing: p.outgoing.filter(r => r.id !== c.id) }));
      showToast('Chat request accepted! 🎉', 'notif'); sounds.notification();
    });
    socket.on('conversation_deleted', ({ request_id }) => {
      setDashboardData(p => ({ ...p, accepted: p.accepted.filter(c => c.id !== request_id) }));
      setActiveChat(null); setMessages([]);
    });
    socket.on('request_sent', r => setDashboardData(p => ({ ...p, outgoing: [r, ...p.outgoing] })));
    socket.on('previous_messages', h => setMessages(h));
    socket.on('receive_message', m => {
      setMessages(p => [...p, { ...m, reactions: m.reactions || {} }]);
      if (m.sender_email !== user.email) {
        if (!dnd) {
          sounds.receive();
          sendBrowserNotif(`💬 ${m.sender_email.split('@')[0]}`, m.message_content?.startsWith('__') ? 'Sent you something!' : m.message_content);
          showToast(`${m.sender_email.split('@')[0]}: ${m.message_content?.startsWith('__') ? '📎 Attachment' : m.message_content?.slice(0, 40)}`, 'notif');
        }
      }
    });
    socket.on('message_deleted', ({ message_id }) => setMessages(p => p.filter(msg => msg.id !== message_id)));
    socket.on('reaction_updated', ({ message_id, reactions }) => {
      setMessages(p => p.map(m => m.id === message_id ? { ...m, reactions } : m));
    });
    // Seen: peer explicitly called mark_read
    socket.on('messages_read', ({ by }) => { setReadBy(true); setPeerInRoom(true); });
    // Delivered: peer joined the room (even if not yet scrolled to read)
    socket.on('peer_joined_room', ({ email }) => { setPeerInRoom(true); });
    socket.on('peer_typing', () => setPeerTyping(true));
    socket.on('peer_stopped_typing', () => setPeerTyping(false));
    socket.on('peer_status_update', ({ email, online, lastSeen, status }) => {
      setOnlineMap(p => ({ ...p, [email]: { online, lastSeen, status } }));
      if (activeChat?.peerEmail === email) setPeerStatus({ online, lastSeen, status });
    });
    socket.on('request_error', d => { showToast(d.message, 'err'); sounds.error(); });

    return () => { socket.disconnect(); socket.off(); };
  }, [user, showToast, dnd]);

  // Emit status changes
  useEffect(() => {
    if (user && socket.connected) socket.emit('set_status', { email: user.email, ...myStatus });
  }, [myStatus, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, peerTyping]);

  // Mark read + reset seen on chat change
  useEffect(() => {
    if (activeChat) {
      setReadBy(false);
      setPeerInRoom(false);
      socket.emit('mark_read', { room_id: activeChat.roomId, email: user.email });
    }
  }, [activeChat]);

  // Mark read whenever new messages arrive and we're focused
  useEffect(() => {
    if (activeChat && document.hasFocus()) {
      socket.emit('mark_read', { room_id: activeChat.roomId, email: user.email });
    }
  }, [messages.length]);

  // Ghost warning: 30 min since last peer message
  useEffect(() => {
    if (!activeChat || messages.length === 0) return;
    const peerMsgs = messages.filter(m => m.sender_email !== user?.email);
    if (peerMsgs.length === 0) return;
    const lastPeerMsg = peerMsgs[peerMsgs.length - 1];
    const minsSince = (Date.now() - new Date(lastPeerMsg.created_at)) / 60000;
    setGhostWarning(minsSince > 30);
  }, [messages, activeChat]);

  // Compute read status for last sent message
  const lastSentMsg = messages.filter(m => m.sender_email === user?.email).slice(-1)[0];
  const readStatus = readBy ? 'seen' : peerInRoom ? 'delivered' : 'sent';

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}${authMode === 'login' ? '/api/login' : '/api/register'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput, password: passInput }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setUser({ email: d.email, token: d.token });
    } catch (err) { showToast(err.message, 'err'); sounds.error(); }
  };

  const handleSendText = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    socket.emit('send_message', { sender_email: user.email, message_content: inputText, room_id: activeChat.roomId, reply_to: replyTo?.id || null });
    setInputText(''); setShowEmoji(false); setShowSlang(false); setReplyTo(null); setReadBy(false);
    sounds.send();
    const ta = document.getElementById('chat-textarea');
    if (ta) ta.style.height = 'auto';
  };

  const deleteMsg = (id) => socket.emit('delete_message', { message_id: id, room_id: activeChat.roomId, sender_email: user.email });
  const reactMsg = (msgId, emoji) => socket.emit('react_message', { message_id: msgId, emoji, email: user.email, room_id: activeChat.roomId });
  const sendGameResult = (result) => { socket.emit('send_message', { sender_email: user.email, message_content: `__GAME__${JSON.stringify(result)}`, room_id: activeChat.roomId }); setShowGames(false); sounds.send(); };
  const setTag = (roomId, tag) => setChatTags(p => ({ ...p, [roomId]: tag }));
  const closeModals = () => { setShowEmoji(false); setShowSlang(false); setShowMoodPicker(false); setShowShare(false); };

  const filteredMessages = searchQuery
    ? messages.filter(m => !isImgMsg(m.message_content) && !isGameMsg(m.message_content) && m.message_content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  /* ── AUTH PAGE ──────────────────────────────────────────────────────────── */
  if (!user) return (
    <div className={`auth-layout ${platform}`}>
      <Toast toasts={toasts} />
      <div className={`auth-hero ${authMode === 'login' ? 'auth-hero-blue' : 'auth-hero-violet'}`}>
        <div className="auth-hero-content">
          <div className="app-brand" style={{ marginBottom: 8 }}>
            <h1 className="app-brand-logo">z-chatt</h1>
            <p className="app-brand-tag">no cap messaging fr fr ✨</p>
          </div>
          <p className="auth-sub" style={{ marginTop: 12 }}>{authMode === 'login' ? 'enter the vibe 🚪' : 'join the squad 🚀'}</p>
          <div className="auth-hero-deco">
            {['🔥', '💫', '👑', '⚡', '🌈'].map((em, i) => <span key={i} className={`deco-float-${i + 1}`}>{em}</span>)}
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <form onSubmit={handleAuth} className="auth-form">
          <h2 className="auth-form-title">{authMode === 'login' ? 'Wassup 👋' : 'New Here? 🌟'}</h2>
          <p className="auth-form-sub">{authMode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>
          <div className="form-group"><label className="form-label">Email</label><input type="email" placeholder="you@email.com" className="nx-input" required value={emailInput} onChange={e => setEmailInput(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Password</label><input type="password" placeholder="••••••••" className="nx-input" required value={passInput} onChange={e => setPassInput(e.target.value)} /></div>
          <button type="submit" className={`btn ${authMode === 'login' ? 'btn-blue' : 'btn-violet'}`} style={{ width: '100%', marginTop: 8 }}>
            {authMode === 'login' ? 'Sign In fr 🚀' : 'Sign Up no cap ✨'}
          </button>
          <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="auth-switch-btn">
            {authMode === 'login' ? 'No account? Join RN 🔥' : 'Got an account? Log in here'}
          </button>
        </form>
      </div>
    </div>
  );

  /* ── MAIN APP ───────────────────────────────────────────────────────────── */
  return (
    <div className={`app-root ${platform}`}>
      <Toast toasts={toasts} />
      {showSchedule && activeChat && <ScheduleModal onSend={d => { socket.emit('send_message', { sender_email: user.email, message_content: encodeMeeting(d), room_id: activeChat.roomId }); sounds.send(); }} onClose={() => setShowSchedule(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}

      {!activeChat ? (
        /* ── DASHBOARD ─────────────────────────────────────────────────── */
        <div className="dashboard-layout">
          <div className="dash-bg-deco" aria-hidden="true">
            {['✨', '🔥', '💫', '👑', '⚡', '🌟', '💜', '🎯'].map((em, i) => <span key={i} className={`dash-deco-${i + 1}`}>{em}</span>)}
          </div>
          <div className="dash-scroll-area">
            <div className="dash-inner">
              {/* Header */}
              <div className="dash-header">
                <div className="app-brand">
                  <h1 className="app-brand-logo">z-chatt</h1>
                  <p className="app-brand-tag">no cap messaging fr fr ✨</p>
                </div>
                {/* User chip with mood + controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowMoodPicker(v => !v)} className="dash-user-chip">
                      <Avatar email={user.email} size={28} status={myStatus} online={!appearOffline} />
                      <span>{user.email.split('@')[0]}</span>
                      {appearOffline
                        ? <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 800 }}>⚫ Offline</span>
                        : myStatus
                          ? <span>{myStatus.emoji} {myStatus.text}</span>
                          : <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 800 }}>🟢 Online</span>
                      }
                    </button>
                    {showMoodPicker && <MoodPicker current={myStatus} onSet={s => { setMyStatus(s); socket.emit('set_status', { email: user.email, ...s }); }} onClear={() => { setMyStatus(null); socket.emit('set_status', { email: user.email, emoji: null, text: null }); }} onClose={() => setShowMoodPicker(false)} />}
                  </div>
                  {/* Dark mode toggle */}
                  <button onClick={() => setDarkMode(d => !d)} className="icon-ctrl-btn" title={darkMode ? 'Light mode' : 'Dark mode'}>
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                  {/* DND toggle */}
                  <button onClick={() => { setDnd(d => !d); showToast(dnd ? 'Notifications on 🔔' : 'Do Not Disturb 🔕', 'info'); }} className="icon-ctrl-btn" title="Do Not Disturb">
                    {dnd ? '🔕' : '🔔'}
                  </button>
                  {/* Appear Offline toggle */}
                  <button
                    onClick={() => {
                      const next = !appearOffline;
                      setAppearOffline(next);
                      if (next) {
                        socket.emit('appear_offline', { email: user.email });
                        showToast('You appear offline to peers 👻', 'info');
                      } else {
                        socket.emit('appear_online', { email: user.email });
                        showToast('You\'re back online 🟢', 'info');
                      }
                      sounds.pop();
                    }}
                    className="icon-ctrl-btn"
                    title={appearOffline ? 'Appear Online' : 'Appear Offline'}
                    style={{ border: appearOffline ? '2px solid #ef4444' : undefined }}
                  >
                    {appearOffline ? '⚫️' : '🟢'}
                  </button>
                  {/* Share */}
                  <button onClick={() => setShowShare(true)} className="icon-ctrl-btn" title="Share z-chatt">🚀</button>
                </div>
              </div>

              {/* Connect */}
              <div className="dash-card">
                <p className="section-label">Connect with someone</p>
                <form onSubmit={e => { e.preventDefault(); socket.emit('send_chat_request', { requester_email: user.email, recipient_email: e.target.email.value }); e.target.reset(); sounds.send(); }} className="connect-form">
                  <input name="email" type="email" required className="nx-input" placeholder="peer@email.com" />
                  <button type="submit" className="btn btn-blue">Add</button>
                </form>
              </div>

              {/* Incoming Requests */}
              {dashboardData.incoming?.length > 0 && (
                <div className="dash-card dash-card-incoming">
                  <p className="section-label" style={{ color: '#6366f1' }}>Incoming Requests 🔔 ({dashboardData.incoming.length})</p>
                  {dashboardData.incoming.map(r => (
                    <div key={r.id} className="request-item request-item-incoming">
                      <Avatar email={r.requester_email} size={38} online={onlineMap[r.requester_email]?.online} />
                      <div className="request-info"><p className="request-name">{r.requester_email.split('@')[0]}</p><p className="request-sub">wants to chat with you</p></div>
                      <button onClick={() => { socket.emit('accept_chat_request', { request_id: r.id }); sounds.pop(); }} className="btn btn-blue" style={{ padding: '6px 14px', fontSize: 12 }}>Accept</button>
                      <button onClick={() => { socket.emit('reject_chat_request', { request_id: r.id }); sounds.pop(); }} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Outgoing / Pending */}
              {dashboardData.outgoing?.length > 0 && (
                <div className="dash-card">
                  <p className="section-label">Sent Requests ⏳</p>
                  {dashboardData.outgoing.map(r => (
                    <div key={r.id} className="request-item request-item-pending">
                      <Avatar email={r.recipient_email} size={38} variant="violet" online={onlineMap[r.recipient_email]?.online} />
                      <div className="request-info"><p className="request-name">{r.recipient_email.split('@')[0]}</p><p className="request-sub">Waiting for response...</p></div>
                      <span className="pending-badge">⏳ Pending</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Channels */}
              <div className="dash-card">
                <p className="section-label">Channels {dashboardData.accepted?.length > 0 && `(${dashboardData.accepted.length})`}</p>
                {dashboardData.accepted?.length === 0 && <div className="channels-empty"><p>No chats yet. Add someone above! 👆</p></div>}
                {dashboardData.accepted?.map(c => {
                  const peer = c.requester_email === user.email ? c.recipient_email : c.requester_email;
                  const tag = chatTags[c.room_id];
                  const peerInfo = onlineMap[peer] || {};
                  return (
                    <div key={c.id} className="channel-item">
                      <div className="channel-click" onClick={() => { setActiveChat({ roomId: c.room_id, peerEmail: peer }); setPeerStatus(peerInfo); socket.emit('join_room', { email: user.email, room_id: c.room_id }); sounds.pop(); }}>
                        <Avatar email={peer} size={40} online={peerInfo.online} status={peerInfo.status} />
                        <div className="channel-info">
                          <p className="channel-name">{peer.split('@')[0]}</p>
                          <StatusLabel online={peerInfo.online} lastSeen={peerInfo.lastSeen} status={peerInfo.status} />
                          {tag && <span className="channel-tag">{tag}</span>}
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-300)', marginLeft: 'auto', flexShrink: 0 }}><path d="m9 18 6-6-6-6" /></svg>
                      </div>
                      <div className="channel-actions">
                        <TagSelect value={tag || ''} onChange={v => setTag(c.room_id, v)} />
                        <button onClick={() => { socket.emit('delete_conversation', { request_id: c.id, room_id: c.room_id, deleter_email: user.email }); sounds.pop(); }} className="del-conv-btn" title="Delete">🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setUser(null)} className="logout-btn">Log out</button>
            </div>
          </div>
        </div>
      ) : (
        /* ── CHAT VIEW ─────────────────────────────────────────────────── */
        <div className="chat-layout">
          <ChatWallpaper />

          {/* Header */}
          <header className="chat-header">
            <button onClick={() => { setActiveChat(null); setMessages([]); setShowGames(false); setReplyTo(null); setShowSearch(false); setSearchQuery(''); }} className="back-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
            </button>
            <Avatar email={activeChat.peerEmail} size={38} online={peerStatus?.online} status={peerStatus?.status} />
            <div className="chat-header-info" style={{ flex: 1, minWidth: 0 }}>
              <p className="chat-peer-name">{activeChat.peerEmail.split('@')[0]}</p>
              <StatusLabel online={peerStatus?.online} lastSeen={peerStatus?.lastSeen} status={peerStatus?.status} />
            </div>
            <button onClick={() => { setShowSearch(s => !s); setSearchQuery(''); }} className="icon-ctrl-btn" title="Search messages">🔍</button>
            <button onClick={() => setDarkMode(d => !d)} className="icon-ctrl-btn" title="Toggle theme">{darkMode ? '☀️' : '🌙'}</button>
            <button onClick={() => setShowSchedule(true)} className="btn btn-gold" style={{ padding: '6px 12px', fontSize: 12 }}>📅</button>
          </header>

          {/* Search bar */}
          {showSearch && (
            <div style={{ padding: '8px 12px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 5 }}>
              <input autoFocus type="text" className="nx-input" placeholder="🔍 Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '8px 12px', fontSize: 13 }} />
              {searchQuery && <p style={{ fontSize: 11, color: 'var(--text-400)', marginTop: 4, paddingLeft: 4, fontWeight: 600 }}>{filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}</p>}
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages" onClick={closeModals}>
            {filteredMessages.length === 0 && !searchQuery && (
              <div className="chat-empty"><span>💬</span><p>Say wagwan! Start the convo ✨</p></div>
            )}
            {filteredMessages.length === 0 && searchQuery && (
              <div className="chat-empty"><span>🔍</span><p>No messages match "{searchQuery}"</p></div>
            )}

            {/* Ghost warning banner */}
            {ghostWarning && (
              <div className="ghost-banner">
                <span style={{ fontSize: 28 }}>👻</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 13 }}>They're ghosting fr...</p>
                  <p style={{ fontSize: 11, opacity: 0.7 }}>No reply in 30+ minutes. Touch grass? 🌿</p>
                </div>
              </div>
            )}

            {filteredMessages.map((m, idx) => {
              const sentByMe = m.sender_email === user.email;
              const isLastSentByMe = sentByMe && idx === filteredMessages.map((x, i) => ({ x, i })).filter(({ x }) => x.sender_email === user.email).slice(-1)[0]?.i;
              return (
                <MessageBubble
                  key={m.id} m={m}
                  isMe={sentByMe}
                  onDelete={deleteMsg}
                  onReact={reactMsg}
                  onReply={setReplyTo}
                  allMessages={messages}
                  isLast={isLastSentByMe}
                  readStatus={readStatus}
                />
              );
            })}

            {peerTyping && (
              <div className="typing-indicator">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                <span className="typing-label">{activeChat.peerEmail.split('@')[0]} is typing...</span>
              </div>
            )}
            <div ref={endRef} style={{ height: 4 }} />
          </div>

          {/* Games Panel */}
          {showGames && <MiniGames onSendResult={sendGameResult} onClose={() => setShowGames(false)} />}

          {/* Footer */}
          <footer className="chat-footer">
            {showDriveInput && (
              <div className="drive-input-row">
                <input autoFocus type="url" className="nx-input" placeholder="Google Drive Link" value={driveLink} onChange={e => setDriveLink(e.target.value)} />
                <button onClick={() => { socket.emit('send_message', { sender_email: user.email, message_content: `📁 Drive: ${driveLink}`, room_id: activeChat.roomId }); setDriveLink(''); setShowDriveInput(false); sounds.send(); }} className="btn btn-blue">Share</button>
              </div>
            )}
            {showEmoji && <div className="emoji-picker-wrap"><Picker data={data} onEmojiSelect={e => { setInputText(p => p + e.native); sounds.pop(); }} theme={darkMode ? 'dark' : 'light'} /></div>}
            {showSlang && <SlangPicker onSelect={t => setInputText(p => p + (p ? ' ' : '') + t)} onClose={() => setShowSlang(false)} />}
            {/* Funny Features Panel */}
            {showFunPanel && (
              <div className="games-panel anim-fade-up" style={{ right: 12, left: 12, bottom: 76 }}>
                <div className="games-header">
                  <span className="games-title">🤣 Funny Features</span>
                  <button onClick={() => setShowFunPanel(false)} className="games-close">✕</button>
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* 🧢 Cap Detector */}
                  <button className="fun-btn" onClick={() => {
                    const labels = ['🧢 CAP DETECTED!', '✅ No cap, that\'s facts!', '🧐 Mid vibes, idk...', '💀 This is sending me 💀'];
                    const result = labels[Math.floor(Math.random() * labels.length)];
                    socket.emit('send_message', { sender_email: user.email, message_content: `🔍 Cap Detector result: ${result}`, room_id: activeChat.roomId });
                    setShowFunPanel(false); sounds.send();
                  }}>
                    <span>🧢</span><div><p className="fun-btn-title">Cap Detector</p><p className="fun-btn-sub">Randomly cap-checks the last message</p></div>
                  </button>

                  {/* 🎭 Main Character Moment */}
                  <button className="fun-btn" onClick={() => {
                    socket.emit('send_message', { sender_email: user.email, message_content: `🎬✨ MAIN CHARACTER MOMENT ✨🎬\n${user.email.split('@')[0]} understood the assignment fr fr no cap bestie slay 💅👑🔥`, room_id: activeChat.roomId });
                    setShowFunPanel(false); sounds.send();
                  }}>
                    <span>🎬</span><div><p className="fun-btn-title">Main Character Moment</p><p className="fun-btn-sub">Drop a dramatic entrance</p></div>
                  </button>

                  {/* 📊 Vibe Poll */}
                  <button className="fun-btn" onClick={() => {
                    socket.emit('send_message', { sender_email: user.email, message_content: `📊 VIBE POLL 🗳️\nRate this convo:\n🔥 Fire  |  😐 Mid  |  🤤 Bussin  |  💀 Dead\n\nDrop your vote bestie!`, room_id: activeChat.roomId });
                    setShowFunPanel(false); sounds.send();
                  }}>
                    <span>📊</span><div><p className="fun-btn-title">Vibe Poll</p><p className="fun-btn-sub">Send a convo vibe check poll</p></div>
                  </button>

                  {/* 💬 Gen Z Spam */}
                  <button className="fun-btn" onClick={() => {
                    const phrases = ['no cap fr fr 🧢', 'bussin bestie 🤤', 'slay queen 💅', 'sheesh 🥶', 'that\'s lowkey fire 🔥', 'understood the assignment 📝', 'it\'s giving main character ✨'];
                    const picks = phrases.sort(() => Math.random() - 0.5).slice(0, 3);
                    picks.forEach((p, i) => setTimeout(() => { socket.emit('send_message', { sender_email: user.email, message_content: p, room_id: activeChat.roomId }); sounds.send(); }, i * 600));
                    setShowFunPanel(false);
                  }}>
                    <span>💬</span><div><p className="fun-btn-title">Slang Spam</p><p className="fun-btn-sub">Send 3 random slang phrases</p></div>
                  </button>

                  {/* 🔥 Rizz Check */}
                  <button className="fun-btn" onClick={() => {
                    const score = Math.floor(Math.random() * 10) + 1;
                    const label = score >= 8 ? '🔥 W Rizz, no cap!' : score >= 5 ? '😐 Mid rizz tbh' : '💀 Zero rizz detected lol';
                    socket.emit('send_message', { sender_email: user.email, message_content: `💈 RIZZ METER CHECK\n${user.email.split('@')[0]}\'s rizz score: ${score}/10\n${'🔥'.repeat(score)}${'⚫'.repeat(10 - score)}\n${label}`, room_id: activeChat.roomId });
                    setShowFunPanel(false); sounds.send();
                  }}>
                    <span>💈</span><div><p className="fun-btn-title">Rizz Check</p><p className="fun-btn-sub">Rate your rizz out of 10</p></div>
                  </button>

                  {/* 👻 Touch Grass Reminder */}
                  <button className="fun-btn" onClick={() => {
                    socket.emit('send_message', { sender_email: user.email, message_content: `🌿 TOUCH GRASS REMINDER 🌿\nHey bestie, we've been chatting for a while now 👀\nMaybe go outside? Skill issue if you don't lol 😭\nNo fr, hydrate, touch grass, come back slaying 💅`, room_id: activeChat.roomId });
                    setShowFunPanel(false); sounds.send();
                  }}>
                    <span>🌿</span><div><p className="fun-btn-title">Touch Grass</p><p className="fun-btn-sub">Send a (passive-aggressive) break reminder</p></div>
                  </button>
                </div>
              </div>
            )}

            {replyTo && <ReplyBar replyTo={replyTo} onCancel={() => setReplyTo(null)} />}

            <div className="footer-input-row">
              <div className="input-bar">
                <button type="button" onClick={() => { setShowEmoji(e => !e); setShowSlang(false); setShowDriveInput(false); setShowGames(false); }} className="icon-btn" title="Emoji">😊</button>
                <textarea id="chat-textarea" rows={1} value={inputText}
                  onChange={e => { setInputText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                  onFocus={() => socket.emit('typing_start', { room_id: activeChat.roomId, email: user.email })}
                  onBlur={() => socket.emit('typing_stop', { room_id: activeChat.roomId })}
                  placeholder="Spill the tea..." className="chat-textarea"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }} />
                <button type="button" onClick={() => { setShowSlang(s => !s); setShowEmoji(false); setShowDriveInput(false); setShowGames(false); }} className="icon-btn" title="Dictionary">📖</button>
                <button type="button" onClick={() => { setShowDriveInput(d => !d); setShowEmoji(false); setShowSlang(false); setShowGames(false); }} className="icon-btn" title="Drive">📁</button>
                <button type="button" onClick={() => { setShowGames(g => !g); setShowEmoji(false); setShowSlang(false); setShowDriveInput(false); setShowFunPanel(false); }} className={`icon-btn ${showGames ? 'icon-btn-active' : ''}`} title="Mini Games">🎮</button>
                <button type="button" onClick={() => { setShowFunPanel(f => !f); setShowGames(false); setShowEmoji(false); setShowSlang(false); setShowDriveInput(false); }} className={`icon-btn ${showFunPanel ? 'icon-btn-active' : ''}`} title="Funny Stuff">🤣</button>
              </div>
              <button onClick={handleSendText} disabled={!inputText.trim()} type="button" className={`send-btn ${inputText.trim() ? 'send-btn-active' : 'send-btn-disabled'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default App;
