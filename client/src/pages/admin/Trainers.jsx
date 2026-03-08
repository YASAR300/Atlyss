import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../../components/layout/DashboardShell';
import api from '../../utils/api';
import { AcademicCapIcon, StarIcon, XMarkIcon, PlusIcon, PencilIcon, CameraIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const T = {
    bg: '#080808', card: '#101010',
    border: '#1a1a1a', borderMid: '#252525',
    hi: '#efefef', text: '#c8c8c8', muted: '#484848', faint: '#262626',
    acc: '#f1642a', accDim: 'rgba(241,100,42,0.09)', accBorder: 'rgba(241,100,42,0.22)',
    amber: '#d09830', amberDim: 'rgba(208,152,48,0.09)', amberBorder: 'rgba(208,152,48,0.25)',
    green: '#4da870', greenDim: 'rgba(77,168,112,0.09)', greenBorder: 'rgba(77,168,112,0.22)',
    blue: '#5085cc', blueDim: 'rgba(80,133,204,0.09)', blueBorder: 'rgba(80,133,204,0.22)',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

const TRAINER_TYPES = [
    { value: 'personal', label: 'Personal Trainer', color: T.acc },
    { value: 'general', label: 'General Trainer', color: T.blue },
    { value: 'common', label: 'Common Trainer', color: T.amber },
];

const TYPE_COLORS = { personal: T.acc, general: T.blue, common: T.amber };
const TYPE_DIM = { personal: T.accDim, general: T.blueDim, common: T.amberDim };
const TYPE_BORDER = { personal: T.accBorder, general: T.blueBorder, common: T.amberBorder };

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

const TextArea = ({ style, ...props }) => {
    const [focus, setFocus] = useState(false);
    return (
        <textarea {...props}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={{ background: '#0a0a0a', border: `1px solid ${focus ? T.acc : T.border}`, borderRadius: 3, padding: '8px 11px', fontFamily: T.mono, fontSize: '0.73rem', color: T.text, outline: 'none', width: '100%', resize: 'vertical', minHeight: 72, transition: 'border-color 0.14s', ...style }}
        />
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

const FormSection = ({ label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px' }}>
        <span style={{ fontFamily: T.mono, fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.acc }}>// {label}</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
);

const ExperienceBar = ({ years }) => {
    const pct = Math.min((years / 15) * 100, 100);
    const level = years < 3 ? 'Junior' : years < 7 ? 'Senior' : 'Expert';
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                    {Array.from({ length: 5 }).map((_, i) => {
                        const f = i < Math.ceil(years / 3);
                        return <StarIcon key={i} style={{ width: 10, height: 10, color: f ? T.amber : T.faint, fill: f ? T.amber : 'none' }} />;
                    })}
                </div>
                <span style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted }}>{years}y · {level}</span>
            </div>
            <div style={{ height: 3, background: T.faint, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${T.amber}, ${T.acc})`, borderRadius: 2, transition: 'width 0.6s ease' }} />
            </div>
        </div>
    );
};

const BLANK_FORM = {
    name: '', email: '', password: '',
    mobile: '', gender: '', address: '',
    weight: '', height: '',
    specialization: 'General Fitness', specializations: '',
    trainerType: 'general', experience: 1,
    salary: '', gymJoinDate: '', successRate: '',
    certificates: '', fitnessJourney: '', termsConditions: '', photo: '',
    age: '', isActive: true,
};

export default function Trainers() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';
    const isTrainer = user?.role === 'trainer';

    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);   // add new
    const [showPassword, setShowPassword] = useState(false);
    const [editTrainer, setEditTrainer] = useState(null); // edit drawer
    const [form, setForm] = useState(BLANK_FORM);
    const [saving, setSaving] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(null); // trainer object
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const photoRef = useRef();

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    const fetchData = () => {
        setLoading(true);
        const endpoint = isAdmin ? '/admin/trainers' : (isTrainer ? '/admin/trainers' : '/member/trainers');
        api.get(endpoint).then(r => setTrainers(r.data.trainers)).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                specializations: form.specializations ? form.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
                certificates: form.certificates ? form.certificates.split(',').map(s => s.trim()).filter(Boolean) : [],
            };
            await api.post('/admin/trainers', payload);
            setShowModal(false);
            setForm(BLANK_FORM);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editTrainer) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                specializations: form.specializations ? form.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
                certificates: form.certificates ? form.certificates.split(',').map(s => s.trim()).filter(Boolean) : [],
            };
            await api.put(`/admin/trainers/${editTrainer.id}`, payload);
            setEditTrainer(null);
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!showReviewModal) return;
        setSaving(true);
        try {
            await api.post(`/member/review/${showReviewModal.trainer?.id}`, reviewForm);
            setShowReviewModal(null);
            setReviewForm({ rating: 5, comment: '' });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed to submit review'); }
        finally { setSaving(false); }
    };

    const deleteTrainer = async (id) => {
        if (!confirm('Remove this trainer?')) return;
        try { await api.delete(`/admin/trainers/${id}`); fetchData(); }
        catch { alert('Failed to delete trainer'); }
    };

    const openEdit = (t) => {
        setEditTrainer(t);
        setForm({
            name: t.name || '', email: t.email || '', password: '',
            mobile: t.trainer?.mobile || '', gender: t.trainer?.gender || '',
            address: t.trainer?.address || '',
            weight: t.trainer?.weight || '', height: t.trainer?.height || '',
            specialization: t.trainer?.specialization || 'General Fitness',
            specializations: (t.trainer?.specializations || []).join(', '),
            trainerType: t.trainer?.trainerType || 'general',
            experience: t.trainer?.experience || 1,
            salary: t.trainer?.salary || '', gymJoinDate: t.trainer?.gymJoinDate ? t.trainer.gymJoinDate.slice(0, 10) : '',
            successRate: t.trainer?.successRate || '',
            certificates: (t.trainer?.certificates || []).join(', '),
            fitnessJourney: t.trainer?.fitnessJourney || '',
            termsConditions: t.trainer?.termsConditions || '',
            photo: t.trainer?.photo || '',
            age: t.trainer?.age || '',
            isActive: t.trainer?.isActive ?? true,
        });
    };

    const handlePhoto = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1500000) { alert('Photo must be under 1.5MB'); return; }
        const reader = new FileReader();
        reader.onload = () => setForm(f => ({ ...f, photo: reader.result }));
        reader.readAsDataURL(file);
    };

    const getTypeChip = (type) => ({
        background: TYPE_DIM[type] || T.accDim,
        border: `1px solid ${TYPE_BORDER[type] || T.accBorder}`,
        color: TYPE_COLORS[type] || T.acc,
    });

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <DashboardShell title="Trainers">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
                .tr-fade { opacity:0; transform:translateY(10px); transition:opacity 0.4s ease,transform 0.4s ease; }
                .tr-fade.in { opacity:1; transform:none; }
                .tr-card { background:${T.card}; border:1px solid ${T.border}; border-radius:4px; padding:22px; position:relative; overflow:hidden; transition:border-color 0.15s,box-shadow 0.15s; }
                .tr-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(208,152,48,0.0),transparent); transition:background 0.3s; pointer-events:none; }
                .tr-card::after  { content:''; position:absolute; top:0; left:0; width:9px; height:9px; border-top:1.5px solid rgba(208,152,48,0.28); border-left:1.5px solid rgba(208,152,48,0.28); pointer-events:none; }
                .tr-card:hover { border-color:rgba(208,152,48,0.25); box-shadow:0 6px 28px rgba(0,0,0,0.4); }
                .tr-card:hover::before { background:linear-gradient(90deg,transparent,rgba(208,152,48,0.4),transparent); }
                .tr-card-glow { position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(208,152,48,0.2),transparent);opacity:0;transition:opacity 0.2s; }
                .tr-card:hover .tr-card-glow { opacity:1; }
                .tr-info-row { display:flex;justify-content:space-between;align-items:center; padding:8px 11px; background:rgba(0,0,0,0.25); border:1px solid ${T.border}; border-radius:3px; margin-bottom:5px; }
                @keyframes cardIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
                @keyframes drawerIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
                @keyframes modalIn { from{opacity:0;transform:translateY(8px) scale(0.98)} to{opacity:1;transform:none} }
                @keyframes spin { to{transform:rotate(360deg)} }
                select option { background:#0d0d0d; color:${T.text}; }
                .drawer-scroll::-webkit-scrollbar { width:3px; }
                .drawer-scroll::-webkit-scrollbar-thumb { background:${T.border}; }
                .cert-chip { display:inline-flex; align-items:center; padding:2px 9px; border-radius:2px; font-family:${T.mono}; font-size:0.55rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; background:${T.greenDim}; border:1px solid ${T.greenBorder}; color:${T.green}; margin:2px; }
                .spec-chip { display:inline-flex; align-items:center; padding:2px 9px; border-radius:2px; font-family:${T.mono}; font-size:0.55rem; font-weight:700; letter-spacing:0.1em; background:${T.blueDim}; border:1px solid ${T.blueBorder}; color:${T.blue}; margin:2px; }
            `}</style>

            <div className={`tr-fade${mounted ? ' in' : ''}`}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
                    <div>
                        <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.muted, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>// staff roster</div>
                        <h1 style={{ fontFamily: T.disp, fontSize: 'clamp(1.9rem,3vw,2.7rem)', color: T.hi, letterSpacing: '0.06em', lineHeight: 1 }}>Trainers</h1>
                        <p style={{ fontFamily: T.mono, fontSize: '0.58rem', color: T.muted, marginTop: 5 }}>{trainers.length} trainers on staff</p>
                    </div>
                    {isAdmin && <BtnPrimary onClick={() => { setForm(BLANK_FORM); setShowModal(true); }}><PlusIcon style={{ width: 13 }} /> Add Trainer</BtnPrimary>}
                </div>

                {/* ── Cards ── */}
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                        <div style={{ width: 24, height: 24, border: `2px solid ${T.acc}33`, borderTopColor: T.acc, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    </div>
                ) : trainers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '52px 0', fontFamily: T.mono, fontSize: '0.72rem', color: T.faint }}>No trainers registered</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                        {trainers.map((t, i) => {
                            const tType = t.trainer?.trainerType || 'general';
                            const chip = getTypeChip(tType);
                            return (
                                <div key={t.id} className="tr-card" style={{ animation: `cardIn 0.38s ease ${i * 0.05}s both` }}>
                                    <div className="tr-card-glow" />

                                    {/* Avatar + Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            {t.trainer?.photo ? (
                                                <img src={t.trainer.photo} alt={t.name} style={{ width: 52, height: 52, borderRadius: 4, objectFit: 'cover', border: `1px solid ${T.amberBorder}` }} />
                                            ) : (
                                                <div style={{ width: 52, height: 52, borderRadius: 4, background: T.amberDim, border: `1px solid ${T.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <AcademicCapIcon style={{ width: 22, height: 22, color: T.amber }} />
                                                </div>
                                            )}
                                            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, borderRadius: 2, background: T.card, border: `1px solid ${T.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.disp, fontSize: '0.6rem', color: T.amber }}>
                                                {t.name?.[0]?.toUpperCase()}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontFamily: T.disp, fontSize: '1.2rem', letterSpacing: '0.04em', color: T.hi, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.62rem', color: T.muted, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</div>
                                            <span style={{ display: 'inline-block', marginTop: 5, padding: '1px 7px', borderRadius: 2, fontFamily: T.mono, fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', ...chip }}>
                                                {TRAINER_TYPES.find(tt => tt.value === tType)?.label || tType}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ height: 1, background: T.border, marginBottom: 12 }} />

                                    {/* Info rows */}
                                    <div className="tr-info-row">
                                        <span style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Specialization</span>
                                        <span style={{ fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, color: T.amber }}>
                                            {t.trainer?.specialization || '—'}
                                        </span>
                                    </div>
                                    {t.trainer?.successRate && (
                                        <div className="tr-info-row">
                                            <span style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Success Rate</span>
                                            <span style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.green }}>{t.trainer.successRate}%</span>
                                        </div>
                                    )}
                                    {t.trainer?.mobile && (
                                        <div className="tr-info-row">
                                            <span style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mobile</span>
                                            <span style={{ fontFamily: T.mono, fontSize: '0.68rem', color: T.text }}>{t.trainer.mobile}</span>
                                        </div>
                                    )}

                                    {/* Specializations chips */}
                                    {t.trainer?.specializations?.length > 0 && (
                                        <div style={{ marginTop: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                                            {t.trainer.specializations.map(s => <span key={s} className="spec-chip">{s}</span>)}
                                        </div>
                                    )}

                                    {/* Certificates */}
                                    {t.trainer?.certificates?.length > 0 && (
                                        <div style={{ marginTop: 6, marginBottom: 4 }}>
                                            {t.trainer.certificates.map(c => <span key={c} className="cert-chip">{c}</span>)}
                                        </div>
                                    )}

                                    {/* Experience bar */}
                                    <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, borderRadius: 3, padding: '10px 12px', marginTop: 12, marginBottom: isAdmin ? 12 : 0 }}>
                                        <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Experience</div>
                                        <ExperienceBar years={t.trainer?.experience || 0} />
                                    </div>

                                    {/* Gym join date */}
                                    {(isAdmin || t.id === user.id) && t.trainer?.gymJoinDate && (
                                        <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted, marginTop: 8 }}>
                                            Joined: {fmtDate(t.trainer.gymJoinDate)}
                                        </div>
                                    )}

                                    {/* Reviews Preview (Admins/Trainers see all, Members see if any) */}
                                    {t.trainer?.reviews?.length > 0 && (
                                        <div style={{ marginTop: 12, borderTop: `1px solid ${T.faint}`, paddingTop: 10 }}>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Recent Feedback</div>
                                            {t.trainer.reviews.slice(0, 2).map((rev, ri) => (
                                                <div key={ri} style={{ marginBottom: 6, padding: '6px 9px', background: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                        <span style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.amber, fontWeight: 700 }}>{Array(rev.rating).fill('★').join('')}</span>
                                                        <span style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.muted }}>{rev.member?.user?.name || 'Member'}</span>
                                                    </div>
                                                    <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.text, lineHeight: 1.3 }}>{rev.comment}</div>
                                                </div>
                                            ))}
                                            {t.trainer.reviews.length > 2 && (
                                                <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.muted, textAlign: 'center', marginTop: 4 }}>+ {t.trainer.reviews.length - 2} more reviews</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Member Review Button */}
                                    {user.role === 'member' && (
                                        <BtnSecondary onClick={() => setShowReviewModal(t)} style={{ width: '100%', marginTop: 12, padding: '6px' }}>
                                            Leave Feedback
                                        </BtnSecondary>
                                    )}

                                    {/* Status Badge */}
                                    {!t.trainer?.isActive && (
                                        <div style={{ marginTop: 10, padding: '4px 10px', background: T.redDim, border: `1px solid ${T.redBorder}`, borderRadius: 2, fontFamily: T.mono, fontSize: '0.6rem', color: T.red, fontWeight: 700, textAlign: 'center' }}>
                                            DEACTIVATED / ON LEAVE
                                        </div>
                                    )}

                                    {/* Admin actions */}
                                    {isAdmin && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                            <BtnSecondary
                                                onClick={() => navigate(`/trainers/${t.id}/profile`)}
                                                style={{ flex: 1, padding: '6px 12px', fontSize: '0.65rem', borderColor: 'rgba(80,133,204,0.3)', color: '#5085cc' }}
                                            >
                                                View Profile
                                            </BtnSecondary>
                                            <BtnSecondary onClick={() => openEdit(t)} style={{ flex: 1, padding: '6px 12px', fontSize: '0.65rem' }}>
                                                <PencilIcon style={{ width: 12 }} /> Edit
                                            </BtnSecondary>
                                            <button
                                                onClick={() => deleteTrainer(t.id)}
                                                style={{ flex: 1, padding: '6px 12px', borderRadius: 3, background: 'transparent', border: '1px solid rgba(140,40,40,0.3)', fontFamily: T.mono, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(175,70,50,0.7)', cursor: 'pointer', transition: 'all 0.14s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,60,50,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,70,60,0.5)'; e.currentTarget.style.color = '#cc6050'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(140,40,40,0.3)'; e.currentTarget.style.color = 'rgba(175,70,50,0.7)'; }}
                                            >Remove</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ═══════════════════════════════════════
                    EDIT TRAINER DRAWER
                ══════════════════════════════════════ */}
                {editTrainer && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget) setEditTrainer(null); }}>
                        <div className="drawer-scroll" style={{ width: '100%', maxWidth: 580, background: '#0c0c0c', borderLeft: '1px solid #222', height: '100%', overflowY: 'auto', animation: 'drawerIn 0.2s ease' }}>
                            {/* Drawer header */}
                            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, background: '#0c0c0c', zIndex: 10 }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    {form.photo ? (
                                        <img src={form.photo} alt="photo" style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover', border: `1px solid ${T.amberBorder}` }} />
                                    ) : (
                                        <div style={{ width: 48, height: 48, borderRadius: 4, background: T.amberDim, border: `1px solid ${T.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.disp, fontSize: '1.3rem', color: T.amber }}>
                                            {editTrainer.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <div onClick={() => photoRef.current?.click()} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                        <CameraIcon style={{ width: 16, color: '#fff' }} />
                                    </div>
                                    <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: T.disp, fontSize: '1.5rem', color: T.hi, letterSpacing: '0.06em', lineHeight: 1 }}>{editTrainer.name}</div>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted, marginTop: 3 }}>{editTrainer.email}</div>
                                </div>
                                <button onClick={() => setEditTrainer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}><XMarkIcon style={{ width: 18 }} /></button>
                            </div>

                            <form onSubmit={handleUpdate} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <FormSection label="Personal" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div><ModalLabel>Name</ModalLabel><InputField value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                                    <div><ModalLabel>Mobile</ModalLabel><InputField value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></div>
                                    <div>
                                        <ModalLabel>Gender</ModalLabel>
                                        <SelectField value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </SelectField>
                                    </div>
                                    <div><ModalLabel>Weight (kg)</ModalLabel><InputField type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
                                    <div><ModalLabel>Height (cm)</ModalLabel><InputField type="number" step="0.1" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} /></div>
                                    <div style={{ gridColumn: 'span 2' }}><ModalLabel>Address</ModalLabel><InputField value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                                </div>

                                <FormSection label="Professional" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <ModalLabel>Trainer Type</ModalLabel>
                                        <SelectField value={form.trainerType} onChange={e => setForm({ ...form, trainerType: e.target.value })}>
                                            {TRAINER_TYPES.map(tt => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
                                        </SelectField>
                                    </div>
                                    <div><ModalLabel>Experience (Years)</ModalLabel><InputField type="number" min="0" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} /></div>
                                    <div><ModalLabel>Primary Specialization</ModalLabel><InputField value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Strength Training" /></div>
                                    <div><ModalLabel>All Specializations (comma-sep.)</ModalLabel><InputField value={form.specializations} onChange={e => setForm({ ...form, specializations: e.target.value })} placeholder="Chest, Back, Full Body" /></div>
                                    {(isAdmin || editTrainer.id === user.id) && (
                                        <>
                                            <div><ModalLabel>Salary (₹/month)</ModalLabel><InputField type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                                            <div><ModalLabel>Gym Join Date</ModalLabel><InputField type="date" value={form.gymJoinDate} onChange={e => setForm({ ...form, gymJoinDate: e.target.value })} /></div>
                                        </>
                                    )}
                                    <div style={{ gridColumn: 'span 2' }}><ModalLabel>Success Rate (%)</ModalLabel><InputField type="number" min="0" max="100" step="0.1" value={form.successRate} onChange={e => setForm({ ...form, successRate: e.target.value })} placeholder="e.g. 87.5" /></div>
                                </div>

                                <FormSection label="Journey & Certs" />
                                <div>
                                    <ModalLabel>Certificates (comma-separated)</ModalLabel>
                                    <InputField value={form.certificates} onChange={e => setForm({ ...form, certificates: e.target.value })} placeholder="e.g. ISSA CPT, ACE, NASM" />
                                </div>
                                <div>
                                    <ModalLabel>Fitness Journey</ModalLabel>
                                    <TextArea value={form.fitnessJourney} onChange={e => setForm({ ...form, fitnessJourney: e.target.value })} placeholder="Past experience and achievements…" />
                                </div>
                                <div>
                                    <ModalLabel>Terms & Conditions</ModalLabel>
                                    <TextArea value={form.termsConditions} onChange={e => setForm({ ...form, termsConditions: e.target.value })} placeholder="Any agreed terms…" style={{ minHeight: 56 }} />
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingBottom: 4 }}>
                                    <BtnSecondary type="button" onClick={() => setEditTrainer(null)} style={{ flex: 1 }}>Cancel</BtnSecondary>
                                    <BtnPrimary type="submit" style={{ flex: 2 }} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</BtnPrimary>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════
                    ADD TRAINER MODAL
                ══════════════════════════════════════ */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
                        <div className="drawer-scroll" style={{ background: '#0c0c0c', border: '1px solid #222', borderRadius: 5, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 28px 80px rgba(0,0,0,0.85)', animation: 'modalIn 0.18s ease', position: 'relative' }}>
                            <div style={{ position: 'sticky', top: 0, background: '#0c0c0c', borderBottom: '1px solid #1a1a1a', padding: '20px 24px 16px', zIndex: 10 }}>
                                <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}><XMarkIcon style={{ width: 16 }} /></button>
                                <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>// new trainer</div>
                                <h2 style={{ fontFamily: T.disp, fontSize: '1.85rem', color: T.hi, letterSpacing: '0.06em', lineHeight: 1 }}>Register Trainer</h2>
                            </div>
                            <form onSubmit={handleCreate} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <FormSection label="Account" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ gridColumn: 'span 2' }}><ModalLabel>Full Name *</ModalLabel><InputField value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                    <div><ModalLabel>Email *</ModalLabel><InputField type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                                    <div style={{ position: 'relative' }}>
                                        <ModalLabel>Password *</ModalLabel>
                                        <div style={{ position: 'relative' }}>
                                            <InputField
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                required
                                                style={{ paddingRight: 38 }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: 'absolute',
                                                    right: 8,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: showPassword ? T.acc : T.muted,
                                                    display: 'flex',
                                                    padding: 6,
                                                    zIndex: 10
                                                }}
                                            >
                                                {showPassword ? <EyeSlashIcon style={{ width: 15 }} /> : <EyeIcon style={{ width: 15 }} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <FormSection label="Personal" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div><ModalLabel>Mobile</ModalLabel><InputField value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></div>
                                    <div><ModalLabel>Age</ModalLabel><InputField type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="30" /></div>
                                    <div>
                                        <ModalLabel>Gender</ModalLabel>
                                        <SelectField value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </SelectField>
                                    </div>
                                    <div><ModalLabel>Weight (kg)</ModalLabel><InputField type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
                                    <div><ModalLabel>Height (cm)</ModalLabel><InputField type="number" step="0.1" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} /></div>
                                    <div style={{ gridColumn: 'span 2' }}><ModalLabel>Address</ModalLabel><InputField value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                                </div>

                                <FormSection label="Professional" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <ModalLabel>Trainer Type</ModalLabel>
                                        <SelectField value={form.trainerType} onChange={e => setForm({ ...form, trainerType: e.target.value })}>
                                            {TRAINER_TYPES.map(tt => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
                                        </SelectField>
                                    </div>
                                    <div><ModalLabel>Experience (Years)</ModalLabel><InputField type="number" min="0" value={form.experience} onChange={e => setForm({ ...form, experience: +e.target.value })} /></div>
                                    <div><ModalLabel>Specialization</ModalLabel><InputField value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Strength Training" /></div>
                                    <div><ModalLabel>Specializations (comma-sep.)</ModalLabel><InputField value={form.specializations} onChange={e => setForm({ ...form, specializations: e.target.value })} placeholder="Chest, Back, Full Body" /></div>
                                    <div><ModalLabel>Salary (₹/month)</ModalLabel><InputField type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
                                    <div><ModalLabel>Gym Join Date</ModalLabel><InputField type="date" value={form.gymJoinDate} onChange={e => setForm({ ...form, gymJoinDate: e.target.value })} /></div>
                                    <div><ModalLabel>Success Rate (%)</ModalLabel><InputField type="number" min="0" max="100" step="0.1" value={form.successRate} onChange={e => setForm({ ...form, successRate: e.target.value })} /></div>
                                </div>

                                <FormSection label="Journey & Certs" />
                                <div>
                                    <ModalLabel>Certificates (comma-sep.)</ModalLabel>
                                    <InputField value={form.certificates} onChange={e => setForm({ ...form, certificates: e.target.value })} placeholder="ISSA CPT, ACE, NASM" />
                                </div>
                                <div>
                                    <ModalLabel>Fitness Journey</ModalLabel>
                                    <TextArea value={form.fitnessJourney} onChange={e => setForm({ ...form, fitnessJourney: e.target.value })} placeholder="Past experience and achievements…" />
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingBottom: 4 }}>
                                    <BtnSecondary type="button" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</BtnSecondary>
                                    <BtnPrimary type="submit" style={{ flex: 2 }} disabled={saving}>{saving ? 'Creating…' : 'Register Trainer'}</BtnPrimary>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════
                    REVIEW MODAL (FOR MEMBERS)
                ══════════════════════════════════════ */}
                {showReviewModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                        <div style={{ background: '#0c0c0c', border: `1px solid ${T.border}`, borderRadius: 4, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.8)', animation: 'modalIn 0.2s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.acc, letterSpacing: '0.15em', textTransform: 'uppercase' }}>// trainer feedback</div>
                                    <h2 style={{ fontFamily: T.disp, fontSize: '1.6rem', color: T.hi, letterSpacing: '0.04em' }}>Review {showReviewModal.name}</h2>
                                </div>
                                <button onClick={() => setShowReviewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><XMarkIcon style={{ width: 18 }} /></button>
                            </div>
                            <form onSubmit={handleSubmitReview}>
                                <div style={{ marginBottom: 18 }}>
                                    <ModalLabel>Rating</ModalLabel>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <button key={v} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: v })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                                                <StarIcon style={{ width: 24, height: 24, color: v <= reviewForm.rating ? T.amber : T.faint, fill: v <= reviewForm.rating ? T.amber : 'none' }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: 20 }}>
                                    <ModalLabel>Your Opinion</ModalLabel>
                                    <TextArea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Tell us about your experience…" required />
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <BtnSecondary type="button" onClick={() => setShowReviewModal(null)} style={{ flex: 1 }}>Not Now</BtnSecondary>
                                    <BtnPrimary type="submit" style={{ flex: 2 }} disabled={saving}>{saving ? 'Submitting…' : 'Post Review'}</BtnPrimary>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}