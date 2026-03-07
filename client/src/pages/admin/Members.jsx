import React, { useEffect, useState, useRef } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import api from '../../utils/api';
import {
    MagnifyingGlassIcon, XMarkIcon,
    ChevronLeftIcon, ChevronRightIcon,
    UserIcon, PhoneIcon, CalendarIcon,
    PlusIcon, ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const T = {
    bg: '#080808', card: '#101010',
    border: '#1a1a1a', borderMid: '#252525',
    hi: '#efefef', text: '#c8c8c8', muted: '#484848', faint: '#262626',
    acc: '#f1642a', accDim: 'rgba(241,100,42,0.09)', accBorder: 'rgba(241,100,42,0.22)',
    green: '#4da870', greenDim: 'rgba(77,168,112,0.09)', greenBorder: 'rgba(77,168,112,0.22)',
    amber: '#d09830', amberDim: 'rgba(208,152,48,0.09)', amberBorder: 'rgba(208,152,48,0.25)',
    blue: '#5085cc', blueDim: 'rgba(80,133,204,0.09)', blueBorder: 'rgba(80,133,204,0.22)',
    red: '#cc4444', redDim: 'rgba(204,68,68,0.09)', redBorder: 'rgba(204,68,68,0.22)',
    purple: '#9060e0', purpleDim: 'rgba(144,96,224,0.09)', purpleBorder: 'rgba(144,96,224,0.22)',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

const MEMBERSHIP = {
    basic: { bg: T.blueDim, border: T.blueBorder, color: T.blue },
    premium: { bg: T.purpleDim, border: T.purpleBorder, color: T.purple },
    vip: { bg: T.amberDim, border: T.amberBorder, color: T.amber },
};

const PACKAGES = [
    { value: '1_month', label: '1 Month' },
    { value: '3_month', label: '3 Months' },
    { value: '6_month', label: '6 Months' },
    { value: '1_year', label: '1 Year' },
    { value: '2_year', label: '2 Years' },
];

const MembershipPill = ({ type }) => {
    const s = MEMBERSHIP[type] || MEMBERSHIP.basic;
    return (
        <span style={{ padding: '2px 8px', borderRadius: 2, fontFamily: T.mono, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
            {type || 'basic'}
        </span>
    );
};

const InputField = ({ style, ...props }) => {
    const [focus, setFocus] = useState(false);
    return (
        <input {...props}
            onFocus={e => { setFocus(true); props.onFocus?.(e); }}
            onBlur={e => { setFocus(false); props.onBlur?.(e); }}
            style={{ background: '#0a0a0a', border: `1px solid ${focus ? T.acc : T.border}`, borderRadius: 3, padding: '8px 11px', fontFamily: T.mono, fontSize: '0.75rem', color: T.text, outline: 'none', width: '100%', transition: 'border-color 0.14s', boxShadow: focus ? '0 0 0 3px rgba(241,100,42,0.07)' : 'none', ...style }}
        />
    );
};

const SelectField = ({ style, children, ...props }) => {
    const [focus, setFocus] = useState(false);
    return (
        <select {...props}
            onFocus={e => { setFocus(true); props.onFocus?.(e); }}
            onBlur={e => { setFocus(false); props.onBlur?.(e); }}
            style={{ background: '#0a0a0a', border: `1px solid ${focus ? T.acc : T.border}`, borderRadius: 3, padding: '8px 28px 8px 10px', fontFamily: T.mono, fontSize: '0.75rem', color: T.text, outline: 'none', cursor: 'pointer', WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23484848' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 9px center', backgroundSize: '10px', transition: 'border-color 0.14s', width: '100%', ...style }}
        >{children}</select>
    );
};

const ModalLabel = ({ children }) => (
    <label style={{ display: 'block', fontFamily: T.mono, fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 5 }}>{children}</label>
);

const BtnPrimary = ({ children, style, ...p }) => {
    const [hover, setHover] = useState(false);
    return (
        <button {...p}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                background: hover ? '#e55a24' : T.acc,
                border: `1px solid ${T.acc}`,
                borderRadius: 3,
                padding: '8px 18px',
                fontFamily: T.mono,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.09em',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.12s',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                boxShadow: '0 2px 10px rgba(241,100,42,0.18)',
                transform: hover ? 'translateY(-1px)' : 'none',
                ...style
            }}
        >{children}</button>
    );
};

const BtnSecondary = ({ children, style, ...p }) => {
    const [hover, setHover] = useState(false);
    return (
        <button {...p}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                background: 'transparent',
                border: `1px solid ${hover ? T.acc : T.borderMid}`,
                borderRadius: 3,
                padding: '8px 16px',
                fontFamily: T.mono,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.09em',
                color: hover ? T.text : T.muted,
                cursor: 'pointer',
                transition: 'all 0.12s',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                ...style
            }}
        >{children}</button>
    );
};

// ── Section header inside form ──
const FormSection = ({ label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px' }}>
        <span style={{ fontFamily: T.mono, fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.acc }}>// {label}</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
);

const BLANK_FORM = {
    name: '', email: '', password: '',
    age: '', gender: '', dob: '', mobile: '', address: '', occupation: '',
    height: '', weight: '', fitnessGoal: 'weight_loss', sessionTime: '',
    membershipType: 'basic', membershipPackage: '', membershipAmount: '', membershipDueDate: '',
    guardianName: '', guardianRelation: '', guardianMobile: '',
    trainerId: '',
};

const BLANK_MEAS = {
    measuredAt: new Date().toISOString().slice(0, 10),
    notes: '',
    weight: '', height: '',
    neck: '', shoulder: '', chest: '', upperArm: '', forearm: '', wrist: '',
    upperAbdomen: '', waist: '', lowerAbdomen: '', hips: '', thigh: '', calf: '', ankle: '',
    bodyFat: '', visceralFat: '', restingMetabolism: '', bmi: '', biologicalAge: '',
};

export default function Members() {
    const { user } = useAuth();
    const isTrainer = user?.role === 'trainer';

    const [members, setMembers] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ search: '', membership: '', page: 1 });
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(BLANK_FORM);
    const [selectedMember, setSelectedMember] = useState(null); // for detail drawer
    const [showMeasModal, setShowMeasModal] = useState(false);
    const [measForm, setMeasForm] = useState(BLANK_MEAS);
    const [measHistory, setMeasHistory] = useState([]);
    const [measTab, setMeasTab] = useState('info'); // 'info' | 'measurements' | 'workout'
    const [saving, setSaving] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    const fetchMembers = () => {
        setLoading(true);
        const p = new URLSearchParams();
        if (filters.search) p.set('search', filters.search);
        if (filters.membership) p.set('membership', filters.membership);
        p.set('page', filters.page); p.set('limit', 12);
        const endpoint = isTrainer ? '/trainer/members' : `/admin/members?${p}`;
        api.get(endpoint).then(r => {
            const data = isTrainer ? r.data.members.map(m => ({ ...m.user, member: m })) : r.data.members;
            setMembers(data);
            setTotal(isTrainer ? data.length : r.data.total);
        }).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchMembers(); }, [filters]);
    useEffect(() => {
        if (!isTrainer) api.get('/admin/trainers').then(r => setTrainers(r.data.trainers)).catch(console.error);
    }, []);

    const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));
    const totalPages = Math.ceil(total / 12);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/admin/members', form);
            setShowModal(false);
            setForm(BLANK_FORM);
            fetchMembers();
        } catch (err) { alert(err.response?.data?.message || 'Failed to create member'); }
        finally { setSaving(false); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedMember) return;
        setSaving(true);
        try {
            await api.put(`/admin/members/${selectedMember.id}`, form);
            setSelectedMember(null);
            fetchMembers();
        } catch (err) { alert(err.response?.data?.message || 'Failed to update'); }
        finally { setSaving(false); }
    };

    const handleAssignTrainer = async (memberId, trainerId) => {
        try {
            await api.put(`/admin/members/${memberId}/trainer`, { trainerId });
            fetchMembers();
        } catch { alert('Failed to assign trainer'); }
    };

    const deleteMember = async (id) => {
        if (!confirm('Remove this member?')) return;
        try { await api.delete(`/admin/members/${id}`); fetchMembers(); }
        catch { alert('Failed'); }
    };

    const openDetail = (m) => {
        setSelectedMember(m);
        setMeasTab('info');
        setForm({
            name: m.name || '', email: m.email || '', password: '',
            age: m.member?.age || '', gender: m.member?.gender || '',
            dob: m.member?.dob ? m.member.dob.slice(0, 10) : '',
            mobile: m.member?.mobile || '', address: m.member?.address || '',
            occupation: m.member?.occupation || '',
            height: m.member?.height || '', weight: m.member?.weight || '',
            fitnessGoal: m.member?.fitnessGoal || 'weight_loss',
            sessionTime: m.member?.sessionTime || '',
            membershipType: m.member?.membershipType || 'basic',
            membershipPackage: m.member?.membershipPackage || '',
            membershipAmount: m.member?.membershipAmount || '',
            membershipDueDate: m.member?.membershipDueDate ? m.member.membershipDueDate.slice(0, 10) : '',
            guardianName: m.member?.guardianName || '',
            guardianRelation: m.member?.guardianRelation || '',
            guardianMobile: m.member?.guardianMobile || '',
            trainerId: m.member?.trainerId || '',
        });
        // load measurements
        const measEndpoint = isTrainer
            ? `/trainer/members/${m.member?.id}/measurements`
            : `/admin/members/${m.id}/measurements`;
        api.get(measEndpoint).then(r => setMeasHistory(r.data.measurements)).catch(() => setMeasHistory([]));
    };

    const saveMeasurement = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const memberId = isTrainer ? selectedMember.member?.id : selectedMember.id;
            const endpoint = isTrainer
                ? `/trainer/members/${memberId}/measurements`
                : `/admin/members/${selectedMember.id}/measurements`;
            await api.post(endpoint, measForm);
            setShowMeasModal(false);
            setMeasForm(BLANK_MEAS);
            // refresh measurements
            const measEndpoint = isTrainer
                ? `/trainer/members/${memberId}/measurements`
                : `/admin/members/${selectedMember.id}/measurements`;
            api.get(measEndpoint).then(r => setMeasHistory(r.data.measurements)).catch(() => { });
        } catch (err) { alert(err.response?.data?.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const fmtDue = (d) => {
        if (!d) return { label: '—', color: T.muted };
        const diff = (new Date(d) - new Date()) / 86400000;
        if (diff < 0) return { label: fmtDate(d) + ' (EXPIRED)', color: T.red };
        if (diff < 15) return { label: fmtDate(d) + ' (DUE SOON)', color: T.amber };
        return { label: fmtDate(d), color: T.green };
    };

    return (
        <DashboardShell title="Members">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
                .mem-fade { opacity:0; transform:translateY(10px); transition:opacity 0.4s ease,transform 0.4s ease; }
                .mem-fade.in { opacity:1; transform:none; }
                .mem-card {
                    background:${T.card}; border:1px solid ${T.border}; border-radius:4px;
                    padding:20px; transition:border-color 0.15s,box-shadow 0.15s;
                    position:relative; overflow:hidden; cursor:pointer;
                }
                .mem-card::before { content:''; position:absolute; top:0; left:0; width:9px; height:9px; border-top:1.5px solid rgba(241,100,42,0.2); border-left:1.5px solid rgba(241,100,42,0.2); pointer-events:none; }
                .mem-card:hover { border-color:${T.borderMid}; box-shadow:0 6px 28px rgba(0,0,0,0.4); }
                .mem-card-glow { position:absolute; bottom:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(241,100,42,0.22),transparent); opacity:0; transition:opacity 0.2s; pointer-events:none; }
                .mem-card:hover .mem-card-glow { opacity:1; }
                @keyframes cardIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
                @keyframes drawerIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
                @keyframes modalIn { from{opacity:0;transform:translateY(8px) scale(0.98)} to{opacity:1;transform:none} }
                @keyframes spin { to{transform:rotate(360deg)} }
                .info-row { display:flex;justify-content:space-between;align-items:center; padding:8px 11px; background:rgba(0,0,0,0.25); border:1px solid ${T.border}; border-radius:3px; margin-bottom:5px; }
                .pg-btn { background:transparent; border:1px solid ${T.borderMid}; border-radius:3px; padding:5px 11px; font-family:${T.mono}; font-size:0.65rem; color:${T.muted}; cursor:pointer; transition:all 0.12s; display:flex;align-items:center;gap:5px; }
                .pg-btn:hover:not(:disabled) { border-color:${T.acc}; color:${T.text}; }
                .pg-btn:disabled { opacity:0.3;cursor:not-allowed; }
                .tab-btn { padding:6px 14px; border:1px solid transparent; border-radius:3px; font-family:${T.mono}; font-size:0.62rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; transition:all 0.13s; background:transparent; }
                .tab-btn.active { background:${T.acc}; border-color:${T.acc}; color:#fff; }
                .tab-btn:not(.active) { color:${T.muted}; border-color:${T.borderMid}; }
                .tab-btn:not(.active):hover { border-color:${T.acc}; color:${T.text}; }
                .meas-row { display:flex; justify-content:space-between; font-family:${T.mono}; font-size:0.65rem; padding:7px 10px; border-bottom:1px solid ${T.border}; }
                .meas-row:last-child { border-bottom:none; }
                select option { background:#0d0d0d; color:${T.text}; }
                .drawer-scroll::-webkit-scrollbar { width:3px; }
                .drawer-scroll::-webkit-scrollbar-thumb { background:${T.border}; }
            `}</style>

            <div className={`mem-fade${mounted ? ' in' : ''}`}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
                    <div>
                        <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.muted, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>// member directory</div>
                        <h1 style={{ fontFamily: T.disp, fontSize: 'clamp(1.9rem,3vw,2.7rem)', color: T.hi, letterSpacing: '0.06em', lineHeight: 1 }}>Members</h1>
                        <p style={{ fontFamily: T.mono, fontSize: '0.58rem', color: T.muted, marginTop: 5 }}>{total} members registered</p>
                    </div>
                    {!isTrainer && <BtnPrimary onClick={() => setShowModal(true)}><PlusIcon style={{ width: 13 }} /> Add Member</BtnPrimary>}
                </div>

                {/* ── Filters ── */}
                {!isTrainer && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                            <MagnifyingGlassIcon style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: T.muted, pointerEvents: 'none' }} />
                            <InputField value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Search name, email, mobile, member no…" style={{ paddingLeft: 32 }} />
                        </div>
                        <SelectField value={filters.membership} onChange={e => setFilter('membership', e.target.value)} style={{ width: 170 }}>
                            <option value="">All Memberships</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="vip">VIP</option>
                        </SelectField>
                    </div>
                )}

                {/* ── Cards ── */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                        <div style={{ width: 24, height: 24, border: `2px solid ${T.acc}33`, borderTopColor: T.acc, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    </div>
                ) : members.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '52px 0', fontFamily: T.mono, fontSize: '0.72rem', color: T.faint }}>No members found</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 14 }}>
                        {members.map((m, i) => (
                            <div key={m.id} className="mem-card" style={{ animation: `cardIn 0.38s ease ${i * 0.04}s both` }} onClick={() => openDetail(m)}>
                                <div className="mem-card-glow" />
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 3, background: T.accDim, border: `1px solid ${T.accBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.disp, fontSize: '1.3rem', color: T.acc, flexShrink: 0 }}>
                                        {m.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: T.hi, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                                        <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted, marginTop: 2 }}>
                                            {m.member?.memberNo || m.email}
                                        </div>
                                    </div>
                                    <MembershipPill type={m.member?.membershipType} />
                                </div>
                                {/* Quick info */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                                    {m.member?.mobile && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <PhoneIcon style={{ width: 11, color: T.muted, flexShrink: 0 }} />
                                            <span style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.text }}>{m.member.mobile}</span>
                                        </div>
                                    )}
                                    {m.member?.sessionTime && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <CalendarIcon style={{ width: 11, color: T.muted, flexShrink: 0 }} />
                                            <span style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.text, textTransform: 'capitalize' }}>{m.member.sessionTime}</span>
                                        </div>
                                    )}
                                    {m.member?.membershipDueDate && (() => {
                                        const due = fmtDue(m.member.membershipDueDate);
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                <UserIcon style={{ width: 11, color: T.muted, flexShrink: 0 }} />
                                                <span style={{ fontFamily: T.mono, fontSize: '0.6rem', color: due.color }}>Due: {due.label}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div style={{ fontFamily: T.mono, fontSize: '0.58rem', color: T.muted, textAlign: 'right' }}>Click to view →</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {total > 12 && !isTrainer && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 28 }}>
                        <button className="pg-btn" disabled={filters.page <= 1} onClick={() => setFilter('page', filters.page - 1)}>
                            <ChevronLeftIcon style={{ width: 12 }} /> Prev
                        </button>
                        <span style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.muted }}>{filters.page} / {totalPages}</span>
                        <button className="pg-btn" disabled={filters.page >= totalPages} onClick={() => setFilter('page', filters.page + 1)}>
                            Next <ChevronRightIcon style={{ width: 12 }} />
                        </button>
                    </div>
                )}

                {/* ═══════════════════════════════
                    MEMBER DETAIL DRAWER
                ═══════════════════════════════ */}
                {selectedMember && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedMember(null); }}>
                        <div className="drawer-scroll" style={{ width: '100%', maxWidth: 560, background: '#0c0c0c', borderLeft: '1px solid #222', height: '100%', overflowY: 'auto', animation: 'drawerIn 0.2s ease', display: 'flex', flexDirection: 'column' }}>
                            {/* Drawer Header */}
                            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, background: '#0c0c0c', zIndex: 10 }}>
                                <div style={{ width: 46, height: 46, borderRadius: 4, background: T.accDim, border: `1px solid ${T.accBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.disp, fontSize: '1.4rem', color: T.acc, flexShrink: 0 }}>
                                    {selectedMember.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: T.disp, fontSize: '1.5rem', color: T.hi, letterSpacing: '0.06em', lineHeight: 1 }}>{selectedMember.name}</div>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted, marginTop: 3 }}>
                                        {selectedMember.member?.memberNo || selectedMember.email}
                                    </div>
                                </div>
                                <MembershipPill type={selectedMember.member?.membershipType} />
                                <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}><XMarkIcon style={{ width: 18 }} /></button>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: 6, padding: '14px 24px 0', borderBottom: '1px solid #1a1a1a' }}>
                                <button className={`tab-btn${measTab === 'info' ? ' active' : ''}`} onClick={() => setMeasTab('info')}>Profile</button>
                                <button className={`tab-btn${measTab === 'measurements' ? ' active' : ''}`} onClick={() => setMeasTab('measurements')}>Measurements ({measHistory.length})</button>
                                <button className={`tab-btn${measTab === 'workout' ? ' active' : ''}`} onClick={() => setMeasTab('workout')}>Workout Plan</button>
                            </div>

                            <div style={{ padding: '20px 24px', flex: 1 }}>
                                {measTab === 'info' ? (
                                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <FormSection label="Personal Info" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div><ModalLabel>Full Name</ModalLabel><InputField value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                                            <div><ModalLabel>Mobile Number</ModalLabel><InputField value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="+91 00000 00000" /></div>
                                            <div>
                                                <ModalLabel>Gender</ModalLabel>
                                                <SelectField value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                                    <option value="">Select</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </SelectField>
                                            </div>
                                            <div><ModalLabel>Date of Birth</ModalLabel><InputField type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
                                            <div><ModalLabel>Age</ModalLabel><InputField type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
                                            <div><ModalLabel>Occupation</ModalLabel><InputField value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} /></div>
                                        </div>
                                        <div><ModalLabel>Address</ModalLabel><InputField value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>

                                        <FormSection label="Membership" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div>
                                                <ModalLabel>Membership Type</ModalLabel>
                                                <SelectField value={form.membershipType} onChange={e => setForm({ ...form, membershipType: e.target.value })}>
                                                    <option value="basic">Basic</option>
                                                    <option value="premium">Premium</option>
                                                    <option value="vip">VIP</option>
                                                </SelectField>
                                            </div>
                                            <div>
                                                <ModalLabel>Package</ModalLabel>
                                                <SelectField value={form.membershipPackage} onChange={e => setForm({ ...form, membershipPackage: e.target.value })}>
                                                    <option value="">Select Package</option>
                                                    {PACKAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                                </SelectField>
                                            </div>
                                            <div><ModalLabel>Amount (₹)</ModalLabel><InputField type="number" value={form.membershipAmount} onChange={e => setForm({ ...form, membershipAmount: e.target.value })} placeholder="3000" /></div>
                                            <div><ModalLabel>Due Date</ModalLabel><InputField type="date" value={form.membershipDueDate} onChange={e => setForm({ ...form, membershipDueDate: e.target.value })} /></div>
                                            <div><ModalLabel>Joining Date</ModalLabel><InputField type="date" value={selectedMember.member?.joinDate?.slice(0, 10) || ''} disabled style={{ opacity: 0.5 }} /></div>
                                            <div>
                                                <ModalLabel>Session Time</ModalLabel>
                                                <SelectField value={form.sessionTime} onChange={e => setForm({ ...form, sessionTime: e.target.value })}>
                                                    <option value="">Select</option>
                                                    <option value="morning">Morning</option>
                                                    <option value="evening">Evening</option>
                                                    <option value="flexible">Flexible</option>
                                                </SelectField>
                                            </div>
                                        </div>

                                        <FormSection label="Fitness" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                            <div><ModalLabel>Weight (kg)</ModalLabel><InputField type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
                                            <div><ModalLabel>Height (cm)</ModalLabel><InputField type="number" step="0.1" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} /></div>
                                            <div>
                                                <ModalLabel>Fitness Goal</ModalLabel>
                                                <SelectField value={form.fitnessGoal} onChange={e => setForm({ ...form, fitnessGoal: e.target.value })}>
                                                    <option value="weight_loss">Weight Loss</option>
                                                    <option value="muscle_gain">Muscle Gain</option>
                                                    <option value="endurance">Endurance</option>
                                                    <option value="flexibility">Flexibility</option>
                                                    <option value="general_fitness">General Fitness</option>
                                                </SelectField>
                                            </div>
                                        </div>

                                        {!isTrainer && (
                                            <>
                                                <FormSection label="Personal Trainer" />
                                                <div style={{ marginBottom: 10 }}>
                                                    <ModalLabel>Assigned Trainer</ModalLabel>
                                                    <SelectField value={form.trainerId} onChange={e => setForm({ ...form, trainerId: e.target.value })}>
                                                        <option value="">No Trainer</option>
                                                        {trainers.map(t => (
                                                            <option key={t.id} value={t.trainer?.id}>{t.name} ({t.trainer?.specialization})</option>
                                                        ))}
                                                    </SelectField>
                                                </div>

                                                <FormSection label="Guardian / Emergency" />
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    <div><ModalLabel>Guardian Name</ModalLabel><InputField value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} /></div>
                                                    <div><ModalLabel>Relation</ModalLabel><InputField value={form.guardianRelation} onChange={e => setForm({ ...form, guardianRelation: e.target.value })} placeholder="e.g. Father" /></div>
                                                    <div><ModalLabel>Guardian Mobile</ModalLabel><InputField value={form.guardianMobile} onChange={e => setForm({ ...form, guardianMobile: e.target.value })} /></div>
                                                </div>
                                            </>
                                        )}

                                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                            <BtnSecondary type="button" onClick={() => setSelectedMember(null)} style={{ flex: 1 }}>Cancel</BtnSecondary>
                                            {!isTrainer && <BtnPrimary type="submit" style={{ flex: 2 }} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</BtnPrimary>}
                                        </div>
                                        {!isTrainer && (
                                            <button
                                                type="button"
                                                onClick={() => deleteMember(selectedMember.id)}
                                                style={{ width: '100%', padding: '8px', borderRadius: 3, background: 'transparent', border: '1px solid rgba(140,40,40,0.3)', fontFamily: T.mono, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(175,70,50,0.7)', cursor: 'pointer', transition: 'all 0.14s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,60,50,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,70,60,0.5)'; e.currentTarget.style.color = '#cc6050'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(140,40,40,0.3)'; e.currentTarget.style.color = 'rgba(175,70,50,0.7)'; }}
                                            >Remove Member Access</button>
                                        )}
                                    </form>
                                ) : measTab === 'measurements' ? (
                                    /* Measurements tab */
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <span style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted }}>Body measurement records</span>
                                            <BtnPrimary onClick={() => setShowMeasModal(true)} style={{ padding: '6px 13px', fontSize: '0.65rem' }}>
                                                <PlusIcon style={{ width: 12 }} /> Record
                                            </BtnPrimary>
                                        </div>
                                        {measHistory.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: T.mono, fontSize: '0.65rem', color: T.faint }}>No measurements recorded yet</div>
                                        ) : (
                                            measHistory.map((meas, i) => (
                                                <div key={meas.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                                                    <div style={{ padding: '9px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.015)' }}>
                                                        <span style={{ fontFamily: T.mono, fontSize: '0.62rem', color: T.acc, fontWeight: 700 }}>{fmtDate(meas.measuredAt)}</span>
                                                        {meas.bmi && <span style={{ fontFamily: T.mono, fontSize: '0.58rem', color: T.muted }}>BMI: {meas.bmi}</span>}
                                                    </div>
                                                    <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 14px' }}>
                                                        {[
                                                            ['Weight', meas.weight, 'kg'], ['Height', meas.height, 'cm'],
                                                            ['Waist', meas.waist, 'cm'], ['Hips', meas.hips, 'cm'],
                                                            ['Chest', meas.chest, 'cm'], ['B.F%', meas.bodyFat, '%'],
                                                            ['V.F', meas.visceralFat, ''], ['R.M', meas.restingMetabolism, 'kcal'],
                                                            ['Biol. Age', meas.biologicalAge, 'yr'],
                                                        ].filter(([, val]) => val !== null).map(([label, val, unit]) => (
                                                            <div key={label} className="meas-row" style={{ backgroundColor: 'transparent' }}>
                                                                <span style={{ color: T.muted }}>{label}</span>
                                                                <span style={{ color: T.text }}>{val}{unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {meas.notes && <div style={{ padding: '6px 14px 10px', fontFamily: T.mono, fontSize: '0.62rem', color: T.muted, fontStyle: 'italic' }}>{meas.notes}</div>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    /* Workout Plan tab */
                                    <div>
                                        {selectedMember.member?.workoutPlans?.[0] ? (() => {
                                            const plan = selectedMember.member.workoutPlans[0];
                                            return (
                                                <div>
                                                    <div style={{ background: T.accDim, border: `1px solid ${T.accBorder}`, borderRadius: 4, padding: 16, marginBottom: 20 }}>
                                                        <div style={{ fontFamily: T.disp, fontSize: '1.4rem', color: T.hi, marginBottom: 4 }}>{plan.name}</div>
                                                        <div style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.text }}>Goal: {plan.goal} · Difficulty: {plan.difficulty}</div>
                                                        <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.muted, marginTop: 6, textTransform: 'uppercase' }}>Current Active Routine</div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                        {plan.exercises?.map((ex, i) => (
                                                            <div key={ex.id} style={{ borderLeft: `2px solid ${T.borderMid}`, paddingLeft: 12, marginBottom: 4 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.hi, fontWeight: 700 }}>{ex.dayTitle}: {ex.name}</span>
                                                                    <span style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.acc }}>{ex.sets} × {ex.reps}</span>
                                                                </div>
                                                                <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted, marginTop: 2 }}>{ex.targetMuscle} · Rest: {ex.restTime}s</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <div style={{ textAlign: 'center', padding: '40px 0', background: T.card, border: `1px dashed ${T.border}`, borderRadius: 4 }}>
                                                <ClipboardDocumentListIcon style={{ width: 32, color: T.faint, margin: '0 auto 10px' }} />
                                                <div style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.muted }}>No active workout plan found</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════
                    ADD MEMBER MODAL
                ═══════════════════════════════ */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
                        <div className="drawer-scroll" style={{ background: '#0c0c0c', border: '1px solid #222', borderRadius: 5, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 28px 80px rgba(0,0,0,0.85)', animation: 'modalIn 0.18s ease', position: 'relative' }}>
                            <div style={{ position: 'sticky', top: 0, background: '#0c0c0c', borderBottom: '1px solid #1a1a1a', padding: '20px 24px 16px', zIndex: 10 }}>
                                <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', padding: 4, borderRadius: 3 }}>
                                    <XMarkIcon style={{ width: 16 }} />
                                </button>
                                <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>// new member</div>
                                <h2 style={{ fontFamily: T.disp, fontSize: '1.85rem', color: T.hi, letterSpacing: '0.06em', lineHeight: 1 }}>Add New Member</h2>
                            </div>
                            <form onSubmit={handleCreate} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <FormSection label="Account" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ gridColumn: 'span 2' }}><ModalLabel>Full Name *</ModalLabel><InputField value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Member Name" required /></div>
                                    <div><ModalLabel>Email *</ModalLabel><InputField type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" required /></div>
                                    <div><ModalLabel>Password *</ModalLabel><InputField type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required /></div>
                                </div>

                                <FormSection label="Personal Info" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div><ModalLabel>Mobile Number</ModalLabel><InputField value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="+91 00000 00000" /></div>
                                    <div>
                                        <ModalLabel>Gender</ModalLabel>
                                        <SelectField value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </SelectField>
                                    </div>
                                    <div><ModalLabel>Date of Birth</ModalLabel><InputField type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
                                    <div><ModalLabel>Age</ModalLabel><InputField type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="25" /></div>
                                    <div><ModalLabel>Occupation</ModalLabel><InputField value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} placeholder="e.g. Engineer" /></div>
                                    <div>
                                        <ModalLabel>Session Time</ModalLabel>
                                        <SelectField value={form.sessionTime} onChange={e => setForm({ ...form, sessionTime: e.target.value })}>
                                            <option value="">Select</option>
                                            <option value="morning">Morning</option>
                                            <option value="evening">Evening</option>
                                            <option value="flexible">Flexible</option>
                                        </SelectField>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}><ModalLabel>Address</ModalLabel><InputField value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full Address" /></div>
                                </div>

                                <FormSection label="Membership" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <ModalLabel>Membership Type</ModalLabel>
                                        <SelectField value={form.membershipType} onChange={e => setForm({ ...form, membershipType: e.target.value })}>
                                            <option value="basic">Basic</option>
                                            <option value="premium">Premium</option>
                                            <option value="vip">VIP</option>
                                        </SelectField>
                                    </div>
                                    <div>
                                        <ModalLabel>Package Duration</ModalLabel>
                                        <SelectField value={form.membershipPackage} onChange={e => setForm({ ...form, membershipPackage: e.target.value })}>
                                            <option value="">Select Package</option>
                                            {PACKAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                        </SelectField>
                                    </div>
                                    <div><ModalLabel>Amount (₹)</ModalLabel><InputField type="number" value={form.membershipAmount} onChange={e => setForm({ ...form, membershipAmount: e.target.value })} placeholder="3000" /></div>
                                    <div><ModalLabel>Due Date</ModalLabel><InputField type="date" value={form.membershipDueDate} onChange={e => setForm({ ...form, membershipDueDate: e.target.value })} /></div>
                                </div>

                                <FormSection label="Fitness" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <div><ModalLabel>Weight (kg)</ModalLabel><InputField type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="70" /></div>
                                    <div><ModalLabel>Height (cm)</ModalLabel><InputField type="number" step="0.1" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} placeholder="170" /></div>
                                    <div>
                                        <ModalLabel>Fitness Goal</ModalLabel>
                                        <SelectField value={form.fitnessGoal} onChange={e => setForm({ ...form, fitnessGoal: e.target.value })}>
                                            <option value="weight_loss">Weight Loss</option>
                                            <option value="muscle_gain">Muscle Gain</option>
                                            <option value="endurance">Endurance</option>
                                            <option value="flexibility">Flexibility</option>
                                            <option value="general_fitness">General Fitness</option>
                                        </SelectField>
                                    </div>
                                </div>

                                <FormSection label="Trainer Assignment" />
                                <div style={{ marginBottom: 4 }}>
                                    <ModalLabel>Assign Personal Trainer</ModalLabel>
                                    <SelectField value={form.trainerId} onChange={e => setForm({ ...form, trainerId: e.target.value })}>
                                        <option value="">None / General</option>
                                        {trainers.map(t => (
                                            <option key={t.id} value={t.trainer?.id}>{t.name} ({t.trainer?.specialization})</option>
                                        ))}
                                    </SelectField>
                                </div>

                                <FormSection label="Guardian / Emergency Contact" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div><ModalLabel>Guardian Name</ModalLabel><InputField value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} placeholder="e.g. Rahul Sharma" /></div>
                                    <div><ModalLabel>Relation</ModalLabel><InputField value={form.guardianRelation} onChange={e => setForm({ ...form, guardianRelation: e.target.value })} placeholder="e.g. Father, Spouse" /></div>
                                    <div style={{ gridColumn: 'span 2' }}><ModalLabel>Guardian Mobile</ModalLabel><InputField value={form.guardianMobile} onChange={e => setForm({ ...form, guardianMobile: e.target.value })} placeholder="+91 00000 00000" /></div>
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingBottom: 4 }}>
                                    <BtnSecondary type="button" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</BtnSecondary>
                                    <BtnPrimary type="submit" style={{ flex: 2 }} disabled={saving}>{saving ? 'Creating…' : 'Register Member'}</BtnPrimary>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════
                    MEASUREMENT MODAL
                ═══════════════════════════════ */}
                {showMeasModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }}>
                        <div className="drawer-scroll" style={{ background: '#0c0c0c', border: '1px solid #222', borderRadius: 5, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 28px 80px rgba(0,0,0,0.9)', animation: 'modalIn 0.18s ease', position: 'relative' }}>
                            <div style={{ position: 'sticky', top: 0, background: '#0c0c0c', borderBottom: '1px solid #1a1a1a', padding: '18px 24px', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 5 }}>// body measurement</div>
                                    <h2 style={{ fontFamily: T.disp, fontSize: '1.6rem', color: T.hi, letterSpacing: '0.06em', lineHeight: 1 }}>Record Measurements</h2>
                                    <p style={{ fontFamily: T.mono, fontSize: '0.58rem', color: T.muted, marginTop: 4 }}>{selectedMember?.name}</p>
                                </div>
                                <button onClick={() => setShowMeasModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}><XMarkIcon style={{ width: 18 }} /></button>
                            </div>
                            <form onSubmit={saveMeasurement} style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div><ModalLabel>Date</ModalLabel><InputField type="date" value={measForm.measuredAt} onChange={e => setMeasForm({ ...measForm, measuredAt: e.target.value })} /></div>
                                    <div><ModalLabel>Notes</ModalLabel><InputField value={measForm.notes} onChange={e => setMeasForm({ ...measForm, notes: e.target.value })} placeholder="Optional notes" /></div>
                                </div>

                                <FormSection label="Vitals" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div><ModalLabel>Weight (kg)</ModalLabel><InputField type="number" step="0.1" value={measForm.weight} onChange={e => setMeasForm({ ...measForm, weight: e.target.value })} /></div>
                                    <div><ModalLabel>Height (cm)</ModalLabel><InputField type="number" step="0.1" value={measForm.height} onChange={e => setMeasForm({ ...measForm, height: e.target.value })} /></div>
                                </div>

                                <FormSection label="Circumferences (cm)" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    {[
                                        ['neck', 'Neck'], ['shoulder', 'Shoulder'], ['chest', 'Normal Chest'],
                                        ['upperArm', 'Upper Arm'], ['forearm', 'Forearm'], ['wrist', 'Wrist'],
                                        ['upperAbdomen', 'Upper Abdomen'], ['waist', 'Waist'], ['lowerAbdomen', 'Lower Abdomen'],
                                        ['hips', 'Hips'], ['thigh', 'Thigh'], ['calf', 'Calf'], ['ankle', 'Ankle'],
                                    ].map(([key, label]) => (
                                        <div key={key}><ModalLabel>{label}</ModalLabel><InputField type="number" step="0.1" value={measForm[key]} onChange={e => setMeasForm({ ...measForm, [key]: e.target.value })} /></div>
                                    ))}
                                </div>

                                <FormSection label="BCA Report" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <div><ModalLabel>B.F % (Body Fat)</ModalLabel><InputField type="number" step="0.1" value={measForm.bodyFat} onChange={e => setMeasForm({ ...measForm, bodyFat: e.target.value })} /></div>
                                    <div><ModalLabel>V.F (Visceral Fat)</ModalLabel><InputField type="number" step="0.1" value={measForm.visceralFat} onChange={e => setMeasForm({ ...measForm, visceralFat: e.target.value })} /></div>
                                    <div><ModalLabel>R.M (kcal)</ModalLabel><InputField type="number" value={measForm.restingMetabolism} onChange={e => setMeasForm({ ...measForm, restingMetabolism: e.target.value })} /></div>
                                    <div><ModalLabel>B.M.I</ModalLabel><InputField type="number" step="0.01" value={measForm.bmi} onChange={e => setMeasForm({ ...measForm, bmi: e.target.value })} /></div>
                                    <div><ModalLabel>B.A (Biol. Age)</ModalLabel><InputField type="number" value={measForm.biologicalAge} onChange={e => setMeasForm({ ...measForm, biologicalAge: e.target.value })} /></div>
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingBottom: 4 }}>
                                    <BtnSecondary type="button" onClick={() => setShowMeasModal(false)} style={{ flex: 1 }}>Cancel</BtnSecondary>
                                    <BtnPrimary type="submit" style={{ flex: 2 }} disabled={saving}>{saving ? 'Saving…' : 'Save Measurements'}</BtnPrimary>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}