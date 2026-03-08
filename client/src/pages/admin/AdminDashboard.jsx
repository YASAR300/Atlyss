import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../../components/layout/DashboardShell';
import api from '../../utils/api';
import { io } from 'socket.io-client';
import {
    UsersIcon, UserGroupIcon, BuildingOfficeIcon,
    CalendarIcon, ClockIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

/* ─── Mechanical type tokens ─── */
const T = {
    bg: '#0a0a0a',
    panel: '#111111',
    border: '#1e1e1e',
    borderMid: '#2a2a2a',
    text: '#d4d4d4',
    hi: '#f0f0f0',
    muted: '#5a5a5a',
    faint: '#2e2e2e',
    acc: '#f1642a',
    accDim: 'rgba(241,100,42,0.1)',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

const MEMBERSHIP_BADGE_STYLE = {
    basic: { border: '#1e4a6e', color: '#4a7ec7' },
    premium: { border: '#3d2a6e', color: '#8b5cf6' },
    vip: { border: '#5a3d0a', color: '#c89328' },
};

const MembershipPill = ({ type }) => {
    const s = MEMBERSHIP_BADGE_STYLE[type] || MEMBERSHIP_BADGE_STYLE.basic;
    return (
        <span style={{
            padding: '2px 8px',
            borderRadius: 2,
            fontFamily: T.mono, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            border: `1px solid ${s.border}`, color: s.color,
            background: 'transparent',
        }}>{type || 'basic'}</span>
    );
};

/* ─── Stat Card ─── */
const STAT_COLORS = {
    red: { border: '#2e1a10', icon: '#f1642a' },
    orange: { border: '#2e2010', icon: '#c89328' },
    green: { border: '#0e2e1a', icon: '#4a9e6b' },
    blue: { border: '#0e1e2e', icon: '#4a7ec7' },
};

const StatCard = ({ title, value, icon: Icon, color = 'red' }) => {
    const c = STAT_COLORS[color];
    const [hover, setHover] = useState(false);
    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                background: T.panel,
                border: `1px solid ${hover ? c.border : T.border}`,
                borderRadius: 4,
                padding: '18px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                transition: 'border-color 0.14s',
                position: 'relative',
            }}
        >
            {/* corner accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTop: `1px solid ${c.icon}44`, borderLeft: `1px solid ${c.icon}44` }} />
            <div style={{ width: 38, height: 38, borderRadius: 3, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {Icon && <Icon style={{ width: 18, height: 18, color: c.icon }} />}
            </div>
            <div>
                <div style={{ fontFamily: T.mono, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 7 }}>{title}</div>
                <div style={{ fontFamily: T.disp, fontSize: '2rem', color: T.hi, letterSpacing: '0.04em', lineHeight: 1 }}>{value ?? '—'}</div>
            </div>
        </div>
    );
};

/* ─── Input / Select ─── */
const inputSx = {
    background: '#0a0a0a',
    border: '1px solid #1e1e1e',
    borderRadius: 3,
    padding: '8px 11px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.78rem',
    color: '#d4d4d4',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.14s',
};

const InputField = ({ style, ...props }) => {
    const [focus, setFocus] = useState(false);
    return (
        <input
            {...props}
            onFocus={e => { setFocus(true); props.onFocus?.(e); }}
            onBlur={e => { setFocus(false); props.onBlur?.(e); }}
            style={{ ...inputSx, ...(focus ? { borderColor: '#f1642a', boxShadow: '0 0 0 2px rgba(241,100,42,0.07)' } : {}), ...style }}
        />
    );
};

const SelectField = ({ style, children, ...props }) => {
    const [focus, setFocus] = useState(false);
    return (
        <select
            {...props}
            onFocus={e => { setFocus(true); props.onFocus?.(e); }}
            onBlur={e => { setFocus(false); props.onBlur?.(e); }}
            style={{
                ...inputSx,
                cursor: 'pointer',
                WebkitAppearance: 'none', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235a5a5a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 9px center',
                backgroundSize: '10px',
                paddingRight: 28,
                ...(focus ? { borderColor: '#f1642a' } : {}),
                ...style,
            }}
        >
            {children}
        </select>
    );
};

/* ─── Modal ─── */
const Modal = ({ title, subtitle, onClose, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
        <div style={{
            background: '#0d0d0d',
            border: '1px solid #2a2a2a',
            borderRadius: 4, width: '100%', maxWidth: 460, padding: 28,
            boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            animation: 'modalIn 0.2s ease',
            position: 'relative',
        }}>
            {/* corner marks */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderTop: '1px solid #f1642a44', borderLeft: '1px solid #f1642a44' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderBottom: '1px solid #f1642a44', borderRight: '1px solid #f1642a44' }} />
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>// action</div>
                <h2 style={{ fontFamily: T.disp, fontSize: '1.9rem', color: T.hi, letterSpacing: '0.06em', lineHeight: 1, marginBottom: 5 }}>{title}</h2>
                <p style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.muted }}>{subtitle}</p>
            </div>
            {children}
        </div>
    </div>
);

const ModalLabel = ({ children }) => (
    <label style={{ display: 'block', fontFamily: T.mono, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>
        {children}
    </label>
);

/* ─── Buttons ─── */
const BtnPrimary = ({ style, children, ...props }) => (
    <button {...props} style={{
        background: '#f1642a', border: '1px solid #f1642a',
        borderRadius: 3, padding: '9px 18px',
        fontFamily: T.mono, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fff',
        cursor: 'pointer', transition: 'all 0.12s ease', textTransform: 'uppercase',
        ...style,
    }}
        onMouseEnter={e => { e.currentTarget.style.background = '#e55a24'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#f1642a'; }}
    >{children}</button>
);

const BtnSecondary = ({ style, children, ...props }) => (
    <button {...props} style={{
        background: 'transparent', border: '1px solid #2a2a2a',
        borderRadius: 3, padding: '9px 18px',
        fontFamily: T.mono, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
        color: T.muted, cursor: 'pointer', transition: 'all 0.12s ease', textTransform: 'uppercase',
        ...style,
    }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#f1642a'; e.currentTarget.style.color = '#d4d4d4'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = T.muted; }}
    >{children}</button>
);

const BtnDanger = ({ style, children, ...props }) => (
    <button {...props} style={{
        background: 'transparent', border: '1px solid rgba(140,40,40,0.4)',
        borderRadius: 3, padding: '4px 10px',
        fontFamily: T.mono, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em',
        color: 'rgba(180,70,50,0.8)', cursor: 'pointer', transition: 'all 0.12s ease',
        ...style,
    }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,70,60,0.6)'; e.currentTarget.style.color = '#d07060'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(140,40,40,0.4)'; e.currentTarget.style.color = 'rgba(180,70,50,0.8)'; }}
    >{children}</button>
);

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [members, setMembers] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [total, setTotal] = useState(0);
    const [live, setLive] = useState([]);
    const [filters, setFilters] = useState({ search: '', membership: '', goal: '', page: 1 });
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showTrainerModal, setShowTrainerModal] = useState(false);
    const [memberForm, setMemberForm] = useState({ name: '', email: '', password: '', age: 25, height: 170, weight: 70, fitnessGoal: 'weight_loss', membershipType: 'basic' });
    const [trainerForm, setTrainerForm] = useState({ name: '', email: '', password: '', specialization: 'General Fitness', experience: 1 });

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    const fetchData = () => {
        api.get('/admin/stats').then(r => setStats(r.data)).catch(console.error);
        api.get('/admin/trainers').then(r => setTrainers(r.data.trainers)).catch(console.error);
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        setLoading(true);
        const p = new URLSearchParams();
        if (filters.search) p.set('search', filters.search);
        if (filters.membership) p.set('membership', filters.membership);
        if (filters.goal) p.set('goal', filters.goal);
        p.set('page', filters.page); p.set('limit', 10);
        api.get(`/admin/members?${p}`).then(r => { setMembers(r.data.members); setTotal(r.data.total); })
            .catch(console.error).finally(() => setLoading(false));
    }, [filters]);

    useEffect(() => {
        // Use the same base URL as API for socket, stripping /api
        const socketUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
        const socket = io(socketUrl);
        socket.on('attendance_update', d => setLive(prev => [d, ...prev].slice(0, 8)));
        api.get('/attendance/live').then(r => setLive(r.data.attendance?.slice(0, 8) || [])).catch(() => { });
        return () => socket.disconnect();
    }, []);

    const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

    const handleCreateMember = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/members', memberForm);
            setShowMemberModal(false);
            setMemberForm({ name: '', email: '', password: '', age: 25, height: 170, weight: 70, fitnessGoal: 'weight_loss', membershipType: 'basic' });
            setFilters({ ...filters, page: 1 });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed to create member'); }
    };

    const handleCreateTrainer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/trainers', trainerForm);
            setShowTrainerModal(false);
            setTrainerForm({ name: '', email: '', password: '', specialization: 'General Fitness', experience: 1 });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed to create trainer'); }
    };

    const handleAssignTrainer = async (memberId, trainerId) => {
        try {
            await api.put(`/admin/members/${memberId}/assign`, { trainerId: trainerId ? parseInt(trainerId) : null });
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, member: { ...m.member, trainerId: trainerId ? parseInt(trainerId) : null } } : m));
        } catch { alert('Failed to assign trainer'); }
    };

    return (
        <DashboardShell title="Dashboard">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
                .adm-fade { opacity:0; transform:translateY(10px); transition:opacity 0.35s ease, transform 0.35s ease; }
                .adm-fade.in { opacity:1; transform:none; }
                .adm-table-row { border-bottom:1px solid #1a1a1a; transition:background 0.12s; }
                .adm-table-row:hover { background:#141414; }
                .adm-table-row:last-child { border-bottom:none; }
                .adm-th { padding:10px 18px; font-family:'Space Mono',monospace; font-size:0.55rem; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:#3a3a3a; text-align:left; white-space:nowrap; }
                .adm-td { padding:12px 18px; font-size:0.82rem; color:#909090; vertical-align:middle; }
                .live-dot { width:6px;height:6px;border-radius:50%;background:#4a9e6b;animation:blink 1.8s ease infinite;flex-shrink:0; }
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
                @keyframes modalIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
                @keyframes spin { to{transform:rotate(360deg)} }
                @keyframes fadeSlideIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
                .adm-panel { background:#111111; border:1px solid #1e1e1e; border-radius:4px; overflow:hidden; position:relative; }
                .adm-panel::before { content:''; position:absolute; top:0; left:0; width:8px; height:8px; border-top:1px solid rgba(241,100,42,0.3); border-left:1px solid rgba(241,100,42,0.3); }
                .adm-panel::after { content:''; position:absolute; bottom:0; right:0; width:8px; height:8px; border-bottom:1px solid rgba(241,100,42,0.3); border-right:1px solid rgba(241,100,42,0.3); }
                .adm-panel-header { padding:13px 18px; border-bottom:1px solid #1a1a1a; display:flex; align-items:center; gap:10px; flex-wrap:wrap; background:rgba(255,255,255,0.01); }
                .live-card { background:#0f0f0f; border:1px solid #1e1e1e; border-radius:3px; padding:10px 12px; display:flex; align-items:center; gap:10px; min-width:180px; flex:1; transition:border-color 0.13s; }
                .live-card:hover { border-color:#2e2e2e; }
                select option { background:#0d0d0d; color:#d4d4d4; }
            `}</style>

            <div className={`adm-fade ${mounted ? 'in' : ''}`}>

                {/* ── Page Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>// admin panel</div>
                        <h1 style={{ fontFamily: T.disp, fontSize: 'clamp(1.8rem,3vw,2.6rem)', color: T.hi, letterSpacing: '0.06em', lineHeight: 1 }}>
                            CONTROL CENTER
                        </h1>
                        <p style={{ fontFamily: T.mono, fontSize: '0.62rem', color: T.muted, marginTop: 5 }}>full visibility over members, trainers &amp; operations</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <BtnSecondary onClick={() => navigate('/attendance-kiosk')}>Kiosk Mode</BtnSecondary>
                        <BtnSecondary onClick={() => setShowTrainerModal(true)}>+ trainer</BtnSecondary>
                        <BtnPrimary onClick={() => setShowMemberModal(true)}>+ member</BtnPrimary>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
                    <StatCard title="Total Members" value={stats?.totalMembers} icon={UsersIcon} color="red" />
                    <StatCard title="Active Members" value={stats?.activeMembers} icon={UserGroupIcon} color="green" />
                    <StatCard title="Trainers on Staff" value={stats?.totalTrainers} icon={BuildingOfficeIcon} color="orange" />
                    <StatCard title="Today's Check-ins" value={stats?.todayAttendance} icon={CalendarIcon} color="blue" />
                </div>

                {/* ── Members Table (Full Width) ── */}
                <div className="adm-panel">
                    <div className="adm-panel-header">
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.2rem', letterSpacing: '0.06em', color: '#fff', marginRight: 'auto' }}>
                            Members Management
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: T.muted }} />
                                <InputField
                                    value={filters.search}
                                    onChange={e => setFilter('search', e.target.value)}
                                    placeholder="Search members…"
                                    style={{ paddingLeft: 30, paddingTop: 7, paddingBottom: 7, fontSize: '0.78rem', width: 190 }}
                                />
                            </div>
                            <SelectField
                                value={filters.membership}
                                onChange={e => setFilter('membership', e.target.value)}
                                style={{ width: 140, paddingTop: 7, paddingBottom: 7, fontSize: '0.78rem' }}
                            >
                                <option value="">All Memberships</option>
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                                <option value="vip">VIP</option>
                            </SelectField>
                            <span style={{ fontSize: '0.7rem', color: T.faint, whiteSpace: 'nowrap', paddingRight: 4 }}>
                                {total} total
                            </span>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.25)' }}>
                                    {['Member', 'Membership', 'Assign Trainer', 'Status', 'Joined', ''].map(h => (
                                        <th key={h} className="adm-th">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ padding: '52px 20px', textAlign: 'center', color: T.faint }}>
                                        <div style={{ display: 'inline-block', width: 22, height: 22, border: '2px solid rgba(255,80,0,0.3)', borderTopColor: '#ff5500', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    </td></tr>
                                ) : members.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: '52px 20px', textAlign: 'center', color: T.faint, fontSize: '0.82rem' }}>No members found</td></tr>
                                ) : members.map(m => (
                                    <tr key={m.id} className="adm-table-row">
                                        <td className="adm-td">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,80,20,0.1)', border: '1px solid rgba(255,80,20,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.1rem', color: '#ff6030', flexShrink: 0 }}>
                                                    {m.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{m.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: T.muted }}>{m.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="adm-td"><MembershipPill type={m.member?.membershipType} /></td>
                                        <td className="adm-td">
                                            <SelectField
                                                value={m.member?.trainerId || ''}
                                                onChange={(e) => handleAssignTrainer(m.id, e.target.value)}
                                                style={{ padding: '5px 28px 5px 9px', fontSize: '0.75rem', width: 'auto', minWidth: 120 }}
                                            >
                                                <option value="">Unassigned</option>
                                                {trainers.map(t => <option key={t.id} value={t.trainer?.id}>{t.name}</option>)}
                                            </SelectField>
                                        </td>
                                        <td className="adm-td">
                                            <span style={{
                                                padding: '3px 9px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                                                ...(m.member?.lastAttendance
                                                    ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }
                                                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: T.muted }),
                                            }}>
                                                {m.member?.lastAttendance ? 'Active' : 'New'}
                                            </span>
                                        </td>
                                        <td className="adm-td" style={{ color: T.muted, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                            {m.member?.joinDate ? new Date(m.member.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                                        </td>
                                        <td className="adm-td">
                                            <BtnDanger onClick={() => {
                                                if (confirm(`Remove ${m.name}?`)) {
                                                    api.delete(`/admin/members/${m.id}`).then(() => setMembers(p => p.filter(x => x.id !== m.id)));
                                                }
                                            }}>Remove</BtnDanger>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {total > 10 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '0.72rem', color: T.faint }}>Page {filters.page} of {Math.ceil(total / 10)}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {filters.page > 1 && <BtnSecondary style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => setFilter('page', filters.page - 1)}>← Prev</BtnSecondary>}
                                {filters.page * 10 < total && <BtnSecondary style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => setFilter('page', filters.page + 1)}>Next →</BtnSecondary>}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Live Check-ins (Horizontal Strip) ── */}
                <div className="adm-panel" style={{ marginTop: 20 }}>
                    <div className="adm-panel-header" style={{ paddingTop: 14, paddingBottom: 14 }}>
                        <div className="live-dot" />
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.1rem', letterSpacing: '0.06em', color: '#fff' }}>Live Check-ins</span>
                        <span style={{ fontSize: '0.65rem', color: T.faint, marginLeft: 4 }}>Real-time attendance feed</span>
                        <BtnSecondary onClick={() => navigate('/admin/attendance')} style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '0.6rem' }}>View History</BtnSecondary>
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                        {live.length === 0 ? (
                            <div style={{ padding: '22px 0', textAlign: 'center', color: T.faint, fontSize: '0.8rem' }}>No recent check-ins — waiting for activity…</div>
                        ) : (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {live.map((a, i) => (
                                    <div key={i} className="live-card" style={{ animation: `fadeSlideIn 0.35s ease ${i * 0.04}s both` }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <ClockIcon style={{ width: 15, height: 15, color: '#4ade80' }} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {a.user?.name || a.member?.user?.name || 'Member'}
                                            </div>
                                            <div style={{ fontSize: '0.67rem', color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {a.class?.className || 'General Access'}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: T.faint, marginTop: 2 }}>
                                                {new Date(a.checkInTime || a.checkinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Create Member Modal ── */}
                {showMemberModal && (
                    <Modal title="Add New Member" subtitle="Create a user account and member profile" onClose={() => setShowMemberModal(false)}>
                        <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <ModalLabel>Full Name</ModalLabel>
                                <InputField placeholder="Member Name" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <ModalLabel>Email</ModalLabel>
                                    <InputField placeholder="email@example.com" type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} required />
                                </div>
                                <div>
                                    <ModalLabel>Password</ModalLabel>
                                    <InputField placeholder="••••••••" type="password" value={memberForm.password} onChange={e => setMemberForm({ ...memberForm, password: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <ModalLabel>Fitness Goal</ModalLabel>
                                    <SelectField value={memberForm.fitnessGoal} onChange={e => setMemberForm({ ...memberForm, fitnessGoal: e.target.value })}>
                                        <option value="weight_loss">Weight Loss</option>
                                        <option value="muscle_gain">Muscle Gain</option>
                                        <option value="endurance">Endurance</option>
                                    </SelectField>
                                </div>
                                <div>
                                    <ModalLabel>Membership</ModalLabel>
                                    <SelectField value={memberForm.membershipType} onChange={e => setMemberForm({ ...memberForm, membershipType: e.target.value })}>
                                        <option value="basic">Basic</option>
                                        <option value="premium">Premium</option>
                                        <option value="vip">VIP</option>
                                    </SelectField>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <BtnSecondary type="button" onClick={() => setShowMemberModal(false)} style={{ flex: 1 }}>Cancel</BtnSecondary>
                                <BtnPrimary type="submit" style={{ flex: 2 }}>Create Member</BtnPrimary>
                            </div>
                        </form>
                    </Modal>
                )}

                {/* ── Create Trainer Modal ── */}
                {showTrainerModal && (
                    <Modal title="Register New Trainer" subtitle="Create a user account and trainer profile" onClose={() => setShowTrainerModal(false)}>
                        <form onSubmit={handleCreateTrainer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <ModalLabel>Full Name</ModalLabel>
                                <InputField placeholder="Trainer Name" value={trainerForm.name} onChange={e => setTrainerForm({ ...trainerForm, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <ModalLabel>Email</ModalLabel>
                                    <InputField placeholder="email@example.com" type="email" value={trainerForm.email} onChange={e => setTrainerForm({ ...trainerForm, email: e.target.value })} required />
                                </div>
                                <div>
                                    <ModalLabel>Password</ModalLabel>
                                    <InputField placeholder="••••••••" type="password" value={trainerForm.password} onChange={e => setTrainerForm({ ...trainerForm, password: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <ModalLabel>Specialization</ModalLabel>
                                <InputField placeholder="Yoga, HIIT, Strength…" value={trainerForm.specialization} onChange={e => setTrainerForm({ ...trainerForm, specialization: e.target.value })} required />
                            </div>
                            <div>
                                <ModalLabel>Experience (Years)</ModalLabel>
                                <InputField type="number" placeholder="Years" value={trainerForm.experience} onChange={e => setTrainerForm({ ...trainerForm, experience: e.target.value })} required />
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <BtnSecondary type="button" onClick={() => setShowTrainerModal(false)} style={{ flex: 1 }}>Cancel</BtnSecondary>
                                <BtnPrimary type="submit" style={{ flex: 2 }}>Create Trainer</BtnPrimary>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
            `}</style>
        </DashboardShell>
    );
}