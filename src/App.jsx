import React, { useState, useEffect, useRef, useCallback } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { socket } from './socket';

/* ─── Gen Z Slang Dictionary ────────────────────────────────────────────────── */
const genZSlang = [
  { term: "Rizz", desc: "Charisma or charm", emoji: "🥶" },
  { term: "No Cap", desc: "No lie; telling the truth", emoji: "🧢" },
  { term: "Bet", desc: "Yes, I agree", emoji: "🤝" },
  { term: "Slay", desc: "To do exceptionally well", emoji: "💅" },
  { term: "Sus", desc: "Suspicious or shady", emoji: "📮" },
  { term: "Bussin", desc: "Extremely good (usually food)", emoji: "🤤" },
  { term: "Delulu", desc: "Delusional, in a humorous way", emoji: "🤡" },
  { term: "Gyatt", desc: "Admiration for something attractive", emoji: "🍑" },
  { term: "Valid", desc: "Acceptable or good", emoji: "✅" },
  { term: "Fire", desc: "Exciting or excellent", emoji: "🔥" },
  { term: "Lit", desc: "Exciting or excellent", emoji: "🔥" },
  { term: "Periodt", desc: "Emphasis on a point being final", emoji: "💅" },
  { term: "Vibe check", desc: "Assessing mood/energy", emoji: "🧐" },
  { term: "Sip Tea", desc: "Listening to gossip", emoji: "☕" },
  { term: "Clapback", desc: "A sharp retort or comeback", emoji: "👏" },
  { term: "Living rent-free", desc: "Cannot stop thinking about", emoji: "🧠" },
  { term: "Take several seats", desc: "Calm down / Stop talking", emoji: "🪑" },
  { term: "Sending me", desc: "Making me laugh hard / LMAO", emoji: "💀" },
  { term: "Sheesh", desc: "Hype or surprise", emoji: "🥶" },
  { term: "Understood the assignment", desc: "Doing exactly what was needed perfectly", emoji: "📝" },
  { term: "Hits different", desc: "Special or better than usual", emoji: "💫" },
  { term: "Ghosting", desc: "Suddenly stopping communication", emoji: "👻" },
  { term: "Simp", desc: "Shows excessive affection", emoji: "🥺" },
  { term: "Situationship", desc: "An undefined romantic relationship", emoji: "🤷" },
  { term: "Soft launch", desc: "Subtly posting a new partner", emoji: "🫣" },
  { term: "Red flag", desc: "Warning sign of a bad trait", emoji: "🚩" },
  { term: "Opp", desc: "Opposition or enemy", emoji: "🛑" },
  { term: "Twin", desc: "Best friend or very close person", emoji: "👯" },
  { term: "Main Character Energy", desc: "Acting like the star of your life", emoji: "🌟" },
  { term: "Unc", desc: "Older people vibe", emoji: "👴" },
  { term: "Glow up", desc: "Major positive transformation", emoji: "✨" },
  { term: "Boujee", desc: "High class, luxury", emoji: "🍷" },
  { term: "Cheugy", desc: "Outdated or trying too hard", emoji: "😬" },
  { term: "Drip", desc: "Huge sense of style", emoji: "💧" },
  { term: "Extra", desc: "Over the top, dramatic", emoji: "🎭" },
  { term: "Facts", desc: "Absolute agreement with truth", emoji: "💯" },
  { term: "GOAT", desc: "Greatest Of All Time", emoji: "🐐" },
  { term: "IYKYK", desc: "If you know, you know", emoji: "😉" },
  { term: "Salty", desc: "Being bitter or angry", emoji: "🧂" },
  { term: "Savage", desc: "Doing something without caring", emoji: "😈" },
  { term: "Stan", desc: "Obsessive fan", emoji: "🤩" },
  { term: "FOMO", desc: "Fear Of Missing Out", emoji: "😰" },
  { term: "JOMO", desc: "Joy Of Missing Out", emoji: "😌" },
  { term: "Yeet", desc: "Throwing something forcefully", emoji: "🚀" },
  { term: "Zesty", desc: "Flamboyant or lively", emoji: "🍋" },
  { term: "High-key", desc: "Obvious, out in the open", emoji: "🗣️" },
  { term: "Low-key", desc: "Secretive or mild", emoji: "🤫" },
  { term: "Mid", desc: "Mediocre or average", emoji: "😐" },
  { term: "Ratio", desc: "Bad take (more replies than likes)", emoji: "📉" },
  { term: "Cap", desc: "A lie", emoji: "🧢" },
  { term: "Based", desc: "Being yourself unashamedly", emoji: "🗿" },
  { term: "Big yikes", desc: "Large reaction of disgust", emoji: "😬" },
  { term: "Touch grass", desc: "Go outside/Get off the internet", emoji: "🌿" }
].sort((a, b) => a.term.localeCompare(b.term));

const SlangPicker = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const filtered = genZSlang.filter(s =>
    s.term.toLowerCase().startsWith(search.toLowerCase()) ||
    s.term.toLowerCase().includes(search.toLowerCase()) ||
    s.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="anim-fade-up nx-card" style={{ position: 'absolute', bottom: 80, left: 16, zIndex: 100, width: 320, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', color: 'var(--blue-600)' }}>Gen Z Dictionary 📖</span>
        <button type="button" onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 10 }}>✕</button>
      </div>
      <input autoFocus type="text" className="nx-input" placeholder="Search (e.g. 'rizz' or 's')" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px 12px' }} />
      <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.length === 0 && <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-400)', padding: 10 }}>No cap, could not find that 🧢</p>}
        {filtered.map(slang => (
          <div key={slang.term} onClick={() => { onSelect(`${slang.term} ${slang.emoji}`); onClose(); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: 'var(--bg)', border: '1.5px solid transparent' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-900)' }}>{slang.term}</p>
              <p style={{ fontSize: 10, color: 'var(--text-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slang.desc}</p>
            </div>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{slang.emoji}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const encodeMeeting = (m) => `__MTG__${JSON.stringify(m)}`;
const parseMeeting = (c) => { if (!c?.startsWith('__MTG__')) return null; try { return JSON.parse(c.slice(7)); } catch { return null; } };

/* ─── Toast ────────────────────────────────────────────────────────────────── */
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="nx-toast" style={{ borderLeftColor: toast.type === 'err' ? 'var(--red-500)' : 'var(--blue-500)' }}>
      <p style={{ fontSize: 13, fontWeight: 700 }}>{toast.msg}</p>
    </div>
  );
};

/* ─── Avatar ───────────────────────────────────────────────────────────────── */
const Avatar = ({ email, size = 40, variant = 'blue' }) => {
  const bg = variant === 'violet' ? 'var(--violet-600)' : 'var(--blue-600)';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.4, flexShrink: 0 }}>
      {email?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
};

/* ─── Components: Meetings ─────────────────────────────────────────────────── */
const MeetingCard = ({ meeting }) => {
  const mt = new Date(meeting.time);
  return (
    <div className="nx-card" style={{ padding: 12, border: '1.5px solid var(--gold-400)', background: 'var(--gold-50)', width: 260 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>📅</span>
        <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--gold-600)' }}>MEETING INVITE</span>
      </div>
      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{meeting.title}</p>
      <p style={{ fontSize: 11, color: 'var(--text-500)', marginBottom: 12 }}>
        🕐 {mt.toLocaleDateString()} at {mt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      {meeting.link && (
        <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={{ width: '100%', padding: '8px', fontSize: 12 }}>Join Meet</a>
      )}
    </div>
  );
};

const ScheduleModal = ({ onSend, onClose }) => {
  const [title, setTitle] = useState('');
  const [dt, setDt] = useState('');
  const [link, setLink] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="nx-card anim-scale-in" style={{ maxWidth: 400, width: '100%' }}>
        <h3 style={{ marginBottom: 16 }}>Schedule Meeting</h3>
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

/* ─── App Root ─────────────────────────────────────────────────────────────── */
const App = () => {
  const [platform, setPlatform] = useState('desktop');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [authMode, setAuthMode] = useState('login');
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [toast, setToast] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [dashboardData, setDashboardData] = useState({ incoming: [], outgoing: [], accepted: [] });
  const [messages, setMessages] = useState([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [showSlang, setShowSlang] = useState(false); // Slang picker state

  // Local storage for tags (per user)
  const [chatTags, setChatTags] = useState(() => JSON.parse(localStorage.getItem('nexus_tags') || '{}'));

  const endRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://gen-z-backend-ujq7.onrender.com';

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Persist user and tags
  useEffect(() => {
    if (user) localStorage.setItem('nexus_user', JSON.stringify(user));
    else localStorage.removeItem('nexus_user');
  }, [user]);
  useEffect(() => { localStorage.setItem('nexus_tags', JSON.stringify(chatTags)); }, [chatTags]);

  // Platform detection
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(ua)) setPlatform('android');
    else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) setPlatform('ios');
    else if (/mobile/i.test(ua)) setPlatform('mobile');
    else setPlatform('desktop');
  }, []);

  // Socket setup
  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit('user_online', { email: user.email });
    socket.on('dashboard_data', d => setDashboardData({ incoming: d.incomingRequests, outgoing: d.outgoingRequests, accepted: d.acceptedChats }));
    socket.on('incoming_chat_request', r => setDashboardData(p => ({ ...p, incoming: [r, ...p.incoming] })));
    socket.on('chat_request_accepted', c => setDashboardData(p => ({ ...p, accepted: [c, ...p.accepted], incoming: p.incoming.filter(r => r.id !== c.id), outgoing: p.outgoing.filter(r => r.id !== c.id) })));
    socket.on('conversation_deleted', ({ request_id }) => { setDashboardData(p => ({ ...p, accepted: p.accepted.filter(c => c.id !== request_id) })); setActiveChat(null); });
    socket.on('request_sent', r => setDashboardData(p => ({ ...p, outgoing: [r, ...p.outgoing] })));
    socket.on('previous_messages', h => setMessages(h));
    socket.on('receive_message', m => setMessages(p => [...p, m]));
    socket.on('message_deleted', ({ message_id }) => setMessages(p => p.filter(msg => msg.id !== message_id)));
    socket.on('peer_typing', () => setPeerTyping(true));
    socket.on('peer_stopped_typing', () => setPeerTyping(false));
    socket.on('request_error', d => showToast(d.message, 'err'));
    return () => { socket.disconnect(); socket.off(); };
  }, [user, showToast]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, peerTyping]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passInput })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser({ email: data.email, token: data.token });
    } catch (err) { showToast(err.message, 'err'); }
  };

  const handleSendText = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    socket.emit('send_message', { sender_email: user.email, message_content: inputText, room_id: activeChat.roomId });
    setInputText(''); setShowEmoji(false); setShowSlang(false);
    const ta = document.getElementById('chat-textarea');
    if (ta) ta.style.height = 'auto';
  };

  const deleteMsg = (id) => socket.emit('delete_message', { message_id: id, room_id: activeChat.roomId, sender_email: user.email });

  const setTag = (roomId, tag) => {
    setChatTags(p => ({ ...p, [roomId]: tag }));
  };

  // Close modals when clicking chat area
  const closeModals = () => {
    setShowEmoji(false);
    setShowSlang(false);
  };

  if (!user) return (
    <div className={`app-layout-login ${platform}`} style={{ height: '100vh', display: 'flex' }}>
      <Toast toast={toast} />
      <div className={authMode === 'login' ? 'grad-hero-blue' : 'grad-hero-violet'} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <h1 style={{ fontWeight: 900, fontSize: 56, letterSpacing: '-0.05em', textAlign: 'center' }}>✨ z-talk ✨</h1>
        <p style={{ fontWeight: 700, fontSize: 18, marginTop: 12, opacity: 0.9 }}>{authMode === 'login' ? 'enter the vibe 🚪' : 'join the squad 🚀'}</p>
      </div>
      <div className="login-form-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <form onSubmit={handleAuth} style={{ width: 320 }}>
          <h2 style={{ marginBottom: 24, fontSize: 28, fontWeight: 900 }}>{authMode === 'login' ? 'Wassup 👋' : 'New Here? 🌟'}</h2>
          <input type="email" placeholder="Email" className="nx-input" style={{ marginBottom: 12 }} required value={emailInput} onChange={e => setEmailInput(e.target.value)} />
          <input type="password" placeholder="Password" className="nx-input" style={{ marginBottom: 20 }} required value={passInput} onChange={e => setPassInput(e.target.value)} />
          <button type="submit" className={authMode === 'login' ? 'btn btn-blue' : 'btn btn-violet'} style={{ width: '100%', marginBottom: 16 }}>{authMode === 'login' ? 'Sign In fr' : 'Sign Up no cap'}</button>
          <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-500)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {authMode === 'login' ? "No account? Join RN 🔥" : "Got an account? Log in here"}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`app-container ${platform}`} style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <Toast toast={toast} />
      {showSchedule && <ScheduleModal onSend={d => socket.emit('send_message', { sender_email: user.email, message_content: encodeMeeting(d), room_id: activeChat.roomId })} onClose={() => setShowSchedule(false)} />}

      {/* Minimalist Sideways Branding (Dashboard Only) */}
      {!activeChat && (
        <>
          <div className="side-text-left">✨ Z - T A L K ✨</div>
          <div className="side-text-right">F O R  T H E  C U L T U R E</div>
        </>
      )}

      {!activeChat ? (
        <div className="dash-container" style={{ maxWidth: 500, margin: '40px auto', width: '100%', padding: 20, position: 'relative', zIndex: 10 }}>
          <div className="dash-header-logo anim-fade-up">
            <h2>z-talk</h2>
            <p>the main character energy hub</p>
          </div>
          <div className="nx-card" style={{ marginBottom: 20 }}>
            <p className="section-label">Connect</p>
            <form onSubmit={e => { e.preventDefault(); socket.emit('send_chat_request', { requester_email: user.email, recipient_email: e.target.email.value }); e.target.reset(); }} style={{ display: 'flex', gap: 8 }}>
              <input name="email" type="email" required className="nx-input" placeholder="peer@email.com" />
              <button type="submit" className="btn btn-blue">Add</button>
            </form>
          </div>

          <div className="nx-card">
            <p className="section-label">Channels</p>
            {dashboardData.accepted.map(c => {
              const peer = c.requester_email === user.email ? c.recipient_email : c.requester_email;
              const tag = chatTags[c.room_id];
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1.5px solid var(--border)', borderRadius: 12, marginBottom: 8 }}>
                  <div onClick={() => { setActiveChat({ roomId: c.room_id, peerEmail: peer }); socket.emit('join_room', { email: user.email, room_id: c.room_id }); }} style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar email={peer} size={36} />
                    <div>
                      <p style={{ fontWeight: 700 }}>{peer.split('@')[0]}</p>
                      {tag && <span style={{ fontSize: 10, background: 'var(--blue-100)', color: 'var(--blue-600)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{tag}</span>}
                    </div>
                  </div>
                  <select value={tag || ''} onChange={e => setTag(c.room_id, e.target.value)} style={{ fontSize: 11, border: 'none', background: 'var(--bg)', borderRadius: 6, padding: '4px', cursor: 'pointer', fontWeight: 600 }}>
                    <option value="">Tag Vibes...</option>
                    <option value="Bestie 🤞">Bestie 🤞</option>
                    <option value="Squad 💯">Squad 💯</option>
                    <option value="Tea ☕">Tea ☕</option>
                    <option value="W Rizz 🥶">W Rizz 🥶</option>
                    <option value="Delulu 🤡">Delulu 🤡</option>
                  </select>
                  <button onClick={() => socket.emit('delete_conversation', { request_id: c.id, room_id: c.room_id, deleter_email: user.email })} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14 }}>🗑</button>
                </div>
              );
            })}
          </div>
          <button onClick={() => setUser(null)} style={{ width: '100%', marginTop: 20, color: 'var(--red-500)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Log out</button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{ padding: '12px 20px', borderBottom: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: '#fff' }}>
            <button onClick={() => setActiveChat(null)} className="btn btn-ghost" style={{ padding: 8 }}>←</button>
            <Avatar email={activeChat.peerEmail} size={36} />
            <div style={{ flex: 1 }}><p style={{ fontWeight: 800 }}>{activeChat.peerEmail}</p></div>
            <button onClick={() => setShowSchedule(true)} className="btn btn-gold" style={{ padding: '8px 12px', fontSize: 12 }}>Schedule</button>
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }} onClick={closeModals}>
            {messages.map(m => {
              const isMe = m.sender_email === user.email;
              const mtg = parseMeeting(m.message_content);
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <div className={isMe ? 'bubble-me' : 'bubble-them'} style={{ padding: '10px 14px' }}>
                      {mtg ? <MeetingCard meeting={mtg} /> : <p style={{ fontSize: 14 }}>{m.message_content}</p>}
                      <span style={{ fontSize: 9, opacity: 0.6, marginTop: 4, display: 'block' }}>{fmtTime(m.created_at)}</span>
                    </div>
                    {isMe && !mtg && <button onClick={() => deleteMsg(m.id)} style={{ position: 'absolute', top: -10, right: -10, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer' }}>✕</button>}
                  </div>
                </div>
              );
            })}
            {peerTyping && <div style={{ fontSize: 11, color: 'var(--text-400)' }}>{activeChat.peerEmail.split('@')[0]} is typing...</div>}
            <div ref={endRef} />
          </div>

          <footer style={{ padding: 16, borderTop: '1.5px solid var(--border)', background: '#fff', position: 'relative' }}>
            {showDriveInput && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input autoFocus type="url" className="nx-input" placeholder="Google Drive Link" value={driveLink} onChange={e => setDriveLink(e.target.value)} />
                <button onClick={() => { socket.emit('send_message', { sender_email: user.email, message_content: `📁 Drive: ${driveLink}`, room_id: activeChat.roomId }); setDriveLink(''); setShowDriveInput(false); }} className="btn btn-blue">Share</button>
              </div>
            )}
            {showEmoji && <div style={{ position: 'absolute', bottom: 80, left: 16, zIndex: 100 }}><Picker data={data} onEmojiSelect={e => setInputText(p => p + e.native)} theme="light" /></div>}
            {showSlang && <SlangPicker onSelect={t => setInputText(p => p + (p ? ' ' : '') + t)} onClose={() => setShowSlang(false)} />}

            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', width: '100%' }}>
              <div style={{ display: 'flex', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '1.5rem', flex: 1, padding: '4px 8px', alignItems: 'flex-end', minHeight: 48, boxShadow: 'var(--shadow-sm)' }}>
                <button type="button" onClick={() => { setShowEmoji(!showEmoji); setShowSlang(false); setShowDriveInput(false); }} style={{ background: 'none', border: 'none', padding: '8px', fontSize: 20, cursor: 'pointer', flexShrink: 0, opacity: 0.8 }}>😊</button>
                <textarea
                  id="chat-textarea"
                  rows={1}
                  value={inputText}
                  onChange={e => {
                    setInputText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onFocus={() => socket.emit('typing_start', { room_id: activeChat.roomId, email: user.email })}
                  onBlur={() => socket.emit('typing_stop', { room_id: activeChat.roomId })}
                  placeholder="Spill the tea..."
                  style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', outline: 'none', padding: '10px 4px', fontSize: 16, maxHeight: 120, minHeight: 24, lineHeight: '1.4', fontFamily: 'inherit' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendText();
                    }
                  }}
                />
                <button type="button" onClick={() => { setShowSlang(!showSlang); setShowEmoji(false); setShowDriveInput(false); }} title="Gen Z Dictionary" style={{ background: 'none', border: 'none', padding: '8px 4px', fontSize: 18, cursor: 'pointer', flexShrink: 0, opacity: 0.8 }}>📖</button>
                <button type="button" onClick={() => { setShowDriveInput(!showDriveInput); setShowEmoji(false); setShowSlang(false); }} style={{ background: 'none', border: 'none', padding: '8px 4px', fontSize: 18, cursor: 'pointer', flexShrink: 0, opacity: 0.8 }}>📁</button>
              </div>

              <button
                onClick={() => handleSendText()}
                disabled={!inputText.trim()}
                type="button"
                style={{ width: 44, height: 44, borderRadius: '50%', background: inputText.trim() ? 'var(--blue-500)' : 'var(--text-300)', color: '#fff', border: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputText.trim() ? 'pointer' : 'default', transition: 'all 0.2s', boxShadow: inputText.trim() ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none', marginBottom: 2 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default App;
