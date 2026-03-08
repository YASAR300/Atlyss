import React, { useEffect, useState } from 'react';
import DashboardShell from '../components/layout/DashboardShell';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CalendarIcon, UserIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline';

const T = {
    bg: '#080808', card: '#101010',
    border: '#1a1a1a', borderMid: '#252525',
    hi: '#efefef', text: '#c8c8c8', muted: '#484848', faint: '#262626',
    acc: '#f1642a', accDim: 'rgba(241,100,42,0.09)', accBorder: 'rgba(241,100,42,0.22)',
    green: '#4da870', greenDim: 'rgba(77,168,112,0.09)', greenBorder: 'rgba(77,168,112,0.22)',
    red: '#cc4444', redDim: 'rgba(204,68,68,0.09)', redBorder: 'rgba(204,68,68,0.22)',
    blue: '#5085cc', blueDim: 'rgba(80,133,204,0.09)', blueBorder: 'rgba(80,133,204,0.22)',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

const InputField = ({ style, ...props }) => {
    const [focus, setFocus] = useState(false);
    return (
        <input {...props}
            onFocus={e => { setFocus(true); props.onFocus?.(e); }}
            onBlur={e => { setFocus(false); props.onBlur?.(e); }}
            style={{ background: '#0a0a0a', border: `1px solid ${focus ? T.acc : T.border}`, borderRadius: 3, padding: '8px 11px', fontFamily: T.mono, fontSize: '0.78rem', color: T.text, outline: 'none', width: '100%', transition: 'border-color 0.14s', boxShadow: focus ? '0 0 0 3px rgba(241,100,42,0.07)' : 'none', colorScheme: 'dark', ...style }}
        />
    );
};

const SelectField = ({ style, children, ...props }) => {
    const [focus, setFocus] = useState(false);
    return (
        <select {...props}
            onFocus={e => { setFocus(true); props.onFocus?.(e); }}
            onBlur={e => { setFocus(false); props.onBlur?.(e); }}
            style={{ background: '#0a0a0a', border: `1px solid ${focus ? T.acc : T.border}`, borderRadius: 3, padding: '8px 28px 8px 10px', fontFamily: T.mono, fontSize: '0.78rem', color: T.text, outline: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23484848' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 9px center', backgroundSize: '10px', transition: 'border-color 0.14s', width: '100%', ...style }}
        >{children}</select>
    );
};

const ModalLabel = ({ children }) => (
    <label style={{ display: 'block', fontFamily: T.mono, fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>{children}</label>
);

const BtnPrimary = ({ children, style, ...p }) => (
    <button {...p} style={{ background: T.acc, border: `1px solid ${T.acc}`, borderRadius: 3, padding: '8px 18px', fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.09em', color: '#fff', cursor: 'pointer', transition: 'all 0.12s', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 2px 10px rgba(241,100,42,0.18)', ...style }}
        onMouseEnter={e => { e.currentTarget.style.background = '#e55a24'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.acc; e.currentTarget.style.transform = 'none'; }}
    >{children}</button>
);

/* Capacity bar */
const CapacityBar = ({ enrolled, capacity }) => {
    const pct = Math.min((enrolled / capacity) * 100, 100);
    const color = pct >= 100 ? T.red : pct >= 75 ? T.acc : T.green;
    return (
        <div>
            <div style={{ height: 3, background: T.faint, borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
        </div>
    );
};

export default function Classes() {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [trainers, setTrainers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ className: '', trainerId: '', scheduleTime: '', capacity: 20 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    useEffect(() => {
        const ep = user?.role === 'admin' ? '/admin/classes' : '/member/classes';
        api.get(ep).then(r => setClasses(r.data.classes)).catch(console.error).finally(() => setLoading(false));
        if (user?.role === 'admin') api.get('/admin/trainers').then(r => setTrainers(r.data.trainers)).catch(console.error);
    }, [user]);

    const bookClass = async (id) => {
        setBooking(id);
        try {
            await api.post(`/member/classes/${id}/book`);
            const r = await api.get('/member/classes');
            setClasses(r.data.classes);
        } catch (e) { console.error(e); } finally { setBooking(null); }
    };

    const createClass = async (e) => {
        e.preventDefault();
        const r = await api.post('/admin/classes', form);
        setClasses(p => [r.data.class, ...p]);
        setShowForm(false);
        setForm({ className: '', trainerId: '', scheduleTime: '', capacity: 20 });
    };

    const deleteClass = async (id) => {
        if (!confirm('Delete this class?')) return;
        await api.delete(`/admin/classes/${id}`);
        setClasses(p => p.filter(c => c.id !== id));
    };

    return (
        <DashboardShell title="Classes">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
                .cls-fade { opacity:0; transform:translateY(10px); transition:opacity 0.4s ease,transform 0.4s ease; }
                .cls-fade.in { opacity:1; transform:none; }
                .cls-card {
                    background:${T.card}; border:1px solid ${T.border}; border-radius:4px;
                    padding:20px; position:relative; overflow:hidden;
                    transition:border-color 0.15s, box-shadow 0.15s;
                    display:flex; flex-direction:column; gap:0;
                }
                .cls-card::before { content:''; position:absolute; top:0; left:0; width:9px; height:9px; border-top:1.5px solid rgba(241,100,42,0.25); border-left:1.5px solid rgba(241,100,42,0.25); }
                .cls-card:hover { border-color:rgba(241,100,42,0.25); box-shadow:0 6px 28px rgba(0,0,0,0.4); }
                .cls-card-glow { position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(241,100,42,0.22),transparent);opacity:0;transition:opacity 0.2s; }
                .cls-card:hover .cls-card-glow { opacity:1; }
                .cls-info-row { display:flex;align-items:center;gap:8px;padding:7px 10px;background:rgba(0,0,0,0.2);border:1px solid ${T.border};border-radius:3px; }
                @keyframes cardIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
                @keyframes modalIn { from{opacity:0;transform:translateY(8px) scale(0.98)} to{opacity:1;transform:none} }
                @keyframes spin { to{transform:rotate(360deg)} }
                select option { background:#0d0d0d; color:${T.text}; }
            `}</style>

            <div className={`cls-fade${mounted ? ' in' : ''}`}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ fontFamily: T.mono, fontSize: '0.52rem', color: T.muted, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 7 }}>// schedule</div>
                        <h1 style={{ fontFamily: T.disp, fontSize: 'clamp(1.9rem,3vw,2.7rem)', color: T.hi, letterSpacing: '0.06em', lineHeight: 1 }}>Class Schedule</h1>
                        <p style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted, marginTop: 5 }}>{classes.length} classes available</p>
                    </div>
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setShowForm(f => !f)}
                            style={{ background: showForm ? T.accDim : T.acc, border: `1px solid ${showForm ? T.accBorder : T.acc}`, borderRadius: 3, padding: '8px 18px', fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.09em', color: showForm ? T.acc : '#fff', cursor: 'pointer', transition: 'all 0.12s', textTransform: 'uppercase', boxShadow: showForm ? 'none' : '0 2px 10px rgba(241,100,42,0.18)' }}
                        >
                            {showForm ? '✕ Cancel' : '+ New Class'}
                        </button>
                    )}
                </div>

                {/* ── Admin create form ── */}
                {showForm && user?.role === 'admin' && (
                    <div style={{ background: T.card, border: `1px solid ${T.borderMid}`, borderRadius: 4, padding: '22px 24px', marginBottom: 22, position: 'relative', overflow: 'hidden', animation: 'modalIn 0.18s ease' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 9, height: 9, borderTop: `1.5px solid ${T.acc}44`, borderLeft: `1.5px solid ${T.acc}44` }} />
                        <div style={{ fontFamily: T.mono, fontSize: '0.52rem', color: T.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>// new class</div>
                        <form onSubmit={createClass} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div><ModalLabel>Class Name</ModalLabel><InputField value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} placeholder="Morning HIIT" required /></div>
                            <div>
                                <ModalLabel>Trainer</ModalLabel>
                                <SelectField value={form.trainerId} onChange={e => setForm({ ...form, trainerId: e.target.value })} required>
                                    <option value="">Select Trainer</option>
                                    {trainers.map(t => <option key={t.id} value={t.trainer?.id}>{t.name}</option>)}
                                </SelectField>
                            </div>
                            <div><ModalLabel>Schedule Time</ModalLabel><InputField type="datetime-local" value={form.scheduleTime} onChange={e => setForm({ ...form, scheduleTime: e.target.value })} required /></div>
                            <div><ModalLabel>Capacity</ModalLabel><InputField type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} /></div>
                            <BtnPrimary type="submit" style={{ gridColumn: 'span 2' }}>Create Class</BtnPrimary>
                        </form>
                    </div>
                )}

                {/* ── Cards ── */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                        <div style={{ width: 24, height: 24, border: `2px solid ${T.acc}33`, borderTopColor: T.acc, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    </div>
                ) : classes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '52px 0', fontFamily: T.mono, fontSize: '0.72rem', color: T.faint }}>No classes scheduled</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14 }}>
                        {classes.map((cls, i) => {
                            const enrolled = cls._count?.attendance || 0;
                            const spotsLeft = cls.capacity - enrolled;
                            const isFull = spotsLeft <= 0;
                            const pct = Math.min((enrolled / cls.capacity) * 100, 100);

                            return (
                                <div key={cls.id} className="cls-card" style={{ animation: `cardIn 0.38s ease ${i * 0.04}s both` }}>
                                    <div className="cls-card-glow" />

                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                                        <h3 style={{ fontFamily: T.disp, fontSize: '1.25rem', letterSpacing: '0.06em', color: T.hi, lineHeight: 1, flex: 1 }}>{cls.className}</h3>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 2,
                                            fontFamily: T.mono, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                                            background: isFull ? T.redDim : T.greenDim,
                                            border: `1px solid ${isFull ? T.redBorder : T.greenBorder}`,
                                            color: isFull ? T.red : T.green, flexShrink: 0,
                                        }}>
                                            {isFull ? 'Full' : `${spotsLeft} left`}
                                        </span>
                                    </div>

                                    {/* Info rows */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                        <div className="cls-info-row">
                                            <UserIcon style={{ width: 12, height: 12, color: T.muted, flexShrink: 0 }} />
                                            <span style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {cls.trainer?.user?.name || '—'}
                                            </span>
                                        </div>
                                        <div className="cls-info-row">
                                            <CalendarIcon style={{ width: 12, height: 12, color: T.muted, flexShrink: 0 }} />
                                            <span style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.text }}>
                                                {new Date(cls.scheduleTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="cls-info-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                    <UsersIcon style={{ width: 12, height: 12, color: T.muted }} />
                                                    <span style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.text }}>{enrolled}/{cls.capacity}</span>
                                                </div>
                                                <span style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted }}>{Math.round(pct)}%</span>
                                            </div>
                                            <CapacityBar enrolled={enrolled} capacity={cls.capacity} />
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div style={{ marginTop: 'auto' }}>
                                        {user?.role === 'member' && (
                                            <button
                                                onClick={() => bookClass(cls.id)}
                                                disabled={isFull || cls.isBooked || booking === cls.id}
                                                style={{
                                                    width: '100%', padding: '9px', borderRadius: 3,
                                                    background: cls.isBooked ? T.greenDim : (isFull ? 'transparent' : T.acc),
                                                    border: `1px solid ${cls.isBooked ? T.greenBorder : (isFull ? T.borderMid : T.acc)}`,
                                                    fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700,
                                                    letterSpacing: '0.09em', textTransform: 'uppercase',
                                                    color: cls.isBooked ? T.green : (isFull ? T.muted : '#fff'),
                                                    cursor: (isFull || cls.isBooked) ? 'not-allowed' : 'pointer',
                                                    opacity: isFull ? 0.4 : 1,
                                                    transition: 'all 0.12s',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                                    boxShadow: (isFull || cls.isBooked) ? 'none' : '0 2px 10px rgba(241,100,42,0.18)',
                                                }}
                                                onMouseEnter={e => { if (!isFull && !cls.isBooked && booking !== cls.id) { e.currentTarget.style.background = '#e55a24'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                                onMouseLeave={e => { e.currentTarget.style.background = cls.isBooked ? T.greenDim : (isFull ? 'transparent' : T.acc); e.currentTarget.style.transform = 'none'; }}
                                            >
                                                {booking === cls.id ? (
                                                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                                ) : cls.isBooked ? (
                                                    <span style={{ color: T.green }}>✓ Booked</span>
                                                ) : isFull ? 'Class Full' : 'Book Now'}
                                            </button>
                                        )}
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => deleteClass(cls.id)}
                                                style={{ width: '100%', padding: '8px', borderRadius: 3, background: 'transparent', border: '1px solid rgba(140,40,40,0.3)', fontFamily: T.mono, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(175,70,50,0.7)', cursor: 'pointer', transition: 'all 0.14s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,60,50,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,70,60,0.5)'; e.currentTarget.style.color = '#cc6050'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(140,40,40,0.3)'; e.currentTarget.style.color = 'rgba(175,70,50,0.7)'; }}
                                            >
                                                Delete Class
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}