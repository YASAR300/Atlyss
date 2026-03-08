import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../../components/layout/DashboardShell';
import api from '../../utils/api';
import { UsersIcon, ClipboardDocumentListIcon, SparklesIcon, ClockIcon, CheckCircleIcon, ScaleIcon, ChartBarIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const T = {
    bg: '#080808', card: '#101010',
    border: '#1a1a1a', borderMid: '#252525',
    hi: '#efefef', text: '#c8c8c8', muted: '#484848', faint: '#262626',
    acc: '#f1642a', accDim: 'rgba(241,100,42,0.09)', accBorder: 'rgba(241,100,42,0.22)',
    amber: '#d09830', amberDim: 'rgba(208,152,48,0.09)', amberBorder: 'rgba(208,152,48,0.25)',
    green: '#4da870', greenDim: 'rgba(77,168,112,0.09)', greenBorder: 'rgba(77,168,112,0.22)',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

export default function TrainerDashboard() {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [pendingPlans, setPendingPlans] = useState([]);
    const [selected, setSelected] = useState(null);
    const [plansByDay, setPlansByDay] = useState({});
    const [activeDay, setActiveDay] = useState('Monday');
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]);
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [showMemberAttendance, setShowMemberAttendance] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [membersRes, pendingRes] = await Promise.all([
                    api.get('/trainer/members'),
                    api.get('/workouts/pending'),
                ]);
                setMembers(membersRes.data.members || []);
                setPendingPlans(pendingRes.data.plans || []);
            } catch (err) {
                console.error('Trainer dashboard load failed:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const selectMember = (m) => {
        setSelected(m);
        setActiveDay('Monday');

        // Get their latest active/pending plan's exercises grouped by day
        const activePlan = m.workoutPlans?.find(p => p.status === 'active')
            || m.workoutPlans?.find(p => p.status === 'pending');

        if (activePlan?.exercises) {
            const grouped = DAYS.reduce((acc, day) => {
                acc[day] = activePlan.exercises.filter(ex => ex.day === DAYS.indexOf(day) + 1);
                return acc;
            }, {});
            setPlansByDay(grouped);
        } else {
            setPlansByDay({});
        }
    };

    const memberHasPending = (m) =>
        pendingPlans.some(p => p.memberId === m.id);

    const selectedActivePlan = selected?.workoutPlans?.find(p => p.status === 'active')
        || selected?.workoutPlans?.find(p => p.status === 'pending');

    const todayExercises = plansByDay[activeDay] || [];

    const openAttendanceModal = () => {
        setAttendanceData(members.map(m => ({
            userId: m.userId,
            name: m.user?.name || m.name,
            status: 'PRESENT'
        })));
        setShowAttendanceModal(true);
    };

    const toggleStatus = (userId) => {
        setAttendanceData(prev => prev.map(item =>
            item.userId === userId
                ? { ...item, status: item.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' }
                : item
        ));
    };

    const submitAttendance = async () => {
        setSavingAttendance(true);
        try {
            await api.post('/trainer/attendance/bulk', { attendance: attendanceData });
            toast.success('Attendance recorded successfully');
            setShowAttendanceModal(false);
        } catch (err) {
            toast.error('Failed to record attendance');
        } finally {
            setSavingAttendance(false);
        }
    };

    return (
        <DashboardShell title="Trainer">
            <style>{`
                .t-fade { opacity:0; transform:translateY(10px); transition:all 0.4s ease; }
                .t-fade.in { opacity:1; transform:none; }
                .member-btn { text-align:left; width:100%; padding:10px 12px; border-radius:8px; cursor:pointer; border:1px solid transparent; transition:all 0.15s; background:transparent; }
                .member-btn:hover { background:rgba(255,255,255,0.04); border-color:${T.border}; }
                .member-btn.active { background:rgba(241,100,42,0.09); border-color:rgba(241,100,42,0.3); }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className={`t-fade${mounted ? ' in' : ''}`}>

                {/* ── Header ── */}
                <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontFamily: T.mono, fontSize: '0.52rem', color: T.acc, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>// trainer portal</div>
                        <h1 style={{ fontFamily: T.disp, fontSize: '2.4rem', color: T.hi, letterSpacing: '0.04em', lineHeight: 1 }}>Trainer Hub</h1>
                        <p style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.muted, marginTop: 6 }}>Manage member workout plans and pending approvals</p>
                    </div>
                    <button
                        onClick={openAttendanceModal}
                        style={{ background: T.acc, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 6, fontFamily: T.mono, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 4px 15px ${T.acc}33` }}
                    >
                        <CheckCircleIcon style={{ width: 18 }} />
                        FILL ATTENDANCE
                    </button>
                </div>

                {/* ── Stats ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
                    {[
                        { label: 'My Members', val: members.length, color: T.acc, icon: UsersIcon },
                        { label: 'Pending Approvals', val: pendingPlans.length, color: T.amber, icon: ClockIcon },
                        { label: 'Active Plans', val: members.filter(m => m.workoutPlans?.some(p => p.status === 'active')).length, color: T.green, icon: CheckCircleIcon },
                    ].map(s => (
                        <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <s.icon style={{ width: 22, height: 22, color: s.color, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontFamily: T.mono, fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted }}>{s.label}</div>
                                <div style={{ fontFamily: T.disp, fontSize: '2rem', color: s.color, lineHeight: 1, marginTop: 2 }}>{loading ? '…' : s.val}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Pending Approvals Banner ── */}
                {pendingPlans.length > 0 && (
                    <div
                        onClick={() => navigate('/manage-workouts')}
                        style={{
                            background: T.amberDim, border: `1px solid ${T.amberBorder}`,
                            borderRadius: 8, padding: '14px 20px', marginBottom: 24,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'all 0.15s',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ClockIcon style={{ width: 20, color: T.amber, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontFamily: T.mono, fontSize: '0.65rem', fontWeight: 700, color: T.amber }}>
                                    {pendingPlans.length} AI-GENERATED PLAN{pendingPlans.length > 1 ? 'S' : ''} AWAITING YOUR REVIEW
                                </div>
                                <div style={{ fontFamily: T.mono, fontSize: '0.58rem', color: 'rgba(208,152,48,0.6)', marginTop: 3 }}>
                                    Click to open the review editor → finalize &amp; assign to member
                                </div>
                            </div>
                        </div>
                        <div style={{ fontFamily: T.disp, fontSize: '1rem', color: T.amber, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                            REVIEW PLANS →
                        </div>
                    </div>
                )}

                {/* ── Main Grid: Member List + Plan View ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>

                    {/* Member List */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ padding: '13px 16px', borderBottom: `1px solid ${T.border}`, fontFamily: T.disp, fontSize: '1rem', color: T.hi, letterSpacing: '0.08em' }}>
                            MEMBERS
                        </div>
                        <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 480, overflowY: 'auto' }}>
                            {loading ? (
                                <p style={{ textAlign: 'center', padding: 24, fontSize: '0.75rem', color: T.muted, fontFamily: T.mono }}>Loading…</p>
                            ) : members.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: 24, fontSize: '0.75rem', color: T.muted, fontFamily: T.mono }}>No members assigned</p>
                            ) : members.map(m => {
                                const hasPending = memberHasPending(m);
                                const hasActive = m.workoutPlans?.some(p => p.status === 'active');
                                return (
                                    <button key={m.id} className={`member-btn${selected?.id === m.id ? ' active' : ''}`} onClick={() => selectMember(m)}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: selected?.id === m.id ? '#ff7040' : T.text }}>
                                                {m.user?.name || m.name}
                                            </div>
                                            {hasPending && (
                                                <span style={{ background: T.amberDim, border: `1px solid ${T.amberBorder}`, color: T.amber, fontFamily: T.mono, fontSize: '0.48rem', fontWeight: 700, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                                    PENDING
                                                </span>
                                            )}
                                            {!hasPending && hasActive && (
                                                <span style={{ background: T.greenDim, border: `1px solid ${T.greenBorder}`, color: T.green, fontFamily: T.mono, fontSize: '0.48rem', fontWeight: 700, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                                    ACTIVE
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.67rem', color: T.muted, marginTop: 2, textTransform: 'capitalize' }}>
                                            {m.fitnessGoal?.replace('_', ' ')}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Plan View */}
                    <div>
                        {!selected ? (
                            <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 12, padding: 60, textAlign: 'center', color: T.muted, fontFamily: T.mono, fontSize: '0.85rem' }}>
                                ← Select a member to view their workout plan
                            </div>
                        ) : (
                            <>
                                {/* Member header */}
                                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontFamily: T.disp, fontSize: '1.5rem', color: T.hi, letterSpacing: '0.06em' }}>{selected.user?.name}</div>
                                        <div style={{ fontFamily: T.mono, fontSize: '0.62rem', color: T.muted, marginTop: 3 }}>
                                            Goal: {selected.fitnessGoal?.replace('_', ' ')} · Plan: {selectedActivePlan?.name || 'No plan yet'}
                                            {selectedActivePlan?.status === 'pending' && (
                                                <span style={{ marginLeft: 8, color: T.amber, fontWeight: 700 }}>( PENDING REVIEW )</span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedActivePlan?.status === 'pending' && (
                                        <button
                                            onClick={() => navigate('/manage-workouts')}
                                            style={{ background: T.amber, border: 'none', borderRadius: 6, padding: '8px 18px', fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                        >
                                            <ClipboardDocumentListIcon style={{ width: 16 }} />
                                            REVIEW & APPROVE
                                        </button>
                                    )}
                                    {selectedActivePlan?.status === 'active' && (
                                        <button
                                            onClick={() => navigate('/manage-workouts')}
                                            style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 18px', fontFamily: T.mono, fontSize: '0.7rem', color: T.muted, cursor: 'pointer' }}
                                        >
                                            EDIT PLAN
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowMemberAttendance(true)}
                                        style={{ background: 'rgba(77,168,112,0.09)', border: `1px solid rgba(77,168,112,0.22)`, borderRadius: 6, padding: '8px 18px', fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, color: T.green, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                    >
                                        <CalendarDaysIcon style={{ width: 16 }} />
                                        ATTENDANCE
                                    </button>
                                    <button
                                        onClick={() => navigate(`/trainer/members/${selected.id}/measurements`)}
                                        style={{ background: T.accDim, border: `1px solid ${T.accBorder}`, borderRadius: 6, padding: '8px 18px', fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, color: T.acc, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                    >
                                        <ScaleIcon style={{ width: 16 }} />
                                        MEASUREMENTS
                                    </button>
                                    <button
                                        onClick={() => navigate(`/trainer/members/${selected.id}/progress`)}
                                        style={{ background: 'rgba(74,126,199,0.09)', border: `1px solid rgba(74,126,199,0.22)`, borderRadius: 6, padding: '8px 18px', fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, color: '#4a7ec7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                    >
                                        <ChartBarIcon style={{ width: 16 }} />
                                        PROGRESS
                                    </button>
                                </div>

                                {/* No plan state */}
                                {!selectedActivePlan ? (
                                    <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 12, padding: 48, textAlign: 'center' }}>
                                        <SparklesIcon style={{ width: 36, color: T.faint, margin: '0 auto 12px', opacity: 0.4 }} />
                                        <div style={{ fontFamily: T.mono, fontSize: '0.8rem', color: T.muted }}>No workout plan yet for this member.</div>
                                        <div style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.faint, marginTop: 6 }}>Ask the member to request a plan from their dashboard.</div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Day tabs */}
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                            {DAYS.map(day => (
                                                <button
                                                    key={day}
                                                    onClick={() => setActiveDay(day)}
                                                    style={{
                                                        padding: '6px 16px', borderRadius: 6, fontFamily: T.mono, fontSize: '0.67rem', fontWeight: 700,
                                                        textTransform: 'uppercase', cursor: 'pointer', border: '1px solid',
                                                        background: activeDay === day ? T.acc : 'transparent',
                                                        borderColor: activeDay === day ? T.acc : T.border,
                                                        color: activeDay === day ? '#fff' : T.muted,
                                                        transition: 'all 0.13s',
                                                    }}
                                                >
                                                    {day.slice(0, 3)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Exercises */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {todayExercises.length === 0 ? (
                                                <div style={{ background: T.card, border: `1px dashed ${T.border}`, borderRadius: 10, padding: '28px 20px', textAlign: 'center', fontFamily: T.mono, fontSize: '0.75rem', color: T.muted }}>
                                                    💤 Rest day
                                                </div>
                                            ) : todayExercises.map(ex => (
                                                <div key={ex.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: T.hi }}>{ex.name}</div>
                                                        <div style={{ fontSize: '0.68rem', color: T.muted, marginTop: 2, textTransform: 'capitalize' }}>{ex.targetMuscle}</div>
                                                        {ex.instructions && (
                                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                {ex.instructions}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                                        {[{ v: ex.sets, l: 'Sets', c: T.acc }, { v: ex.reps, l: 'Reps', c: '#fb923c' }].map(b => (
                                                            <div key={b.l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                                                                <div style={{ fontFamily: T.disp, fontSize: '1.5rem', color: b.c, lineHeight: 1 }}>{b.v}</div>
                                                                <div style={{ fontFamily: T.mono, fontSize: '0.54rem', color: T.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{b.l}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Attendance Modal */}
            {showAttendanceModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, width: '100%', maxWidth: 500, padding: 30, animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ marginBottom: 20 }}>
                            <h2 style={{ fontFamily: T.disp, fontSize: '2rem', color: T.hi, letterSpacing: '0.04em' }}>Daily Attendance</h2>
                            <p style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.muted }}>Mark status for your assigned members ({new Date().toLocaleDateString()})</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 10, marginBottom: 25 }}>
                            {attendanceData.map(item => (
                                <div key={item.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.9rem', color: T.hi, fontWeight: 500 }}>{item.name}</div>
                                    <button
                                        onClick={() => toggleStatus(item.userId)}
                                        style={{
                                            border: 'none', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: T.mono, fontSize: '0.65rem', fontWeight: 700,
                                            background: item.status === 'PRESENT' ? T.greenDim : '#ef444422',
                                            color: item.status === 'PRESENT' ? T.green : '#ef4444',
                                            border: `1px solid ${item.status === 'PRESENT' ? T.greenBorder : '#ef444444'}`,
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {item.status}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowAttendanceModal(false)}
                                style={{ flex: 1, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '12px', borderRadius: 8, cursor: 'pointer', fontFamily: T.mono, fontSize: '0.75rem' }}
                            >
                                CANCEL
                            </button>
                            <button
                                disabled={savingAttendance}
                                onClick={submitAttendance}
                                style={{ flex: 2, background: T.acc, border: 'none', color: '#fff', padding: '12px', borderRadius: 8, cursor: 'pointer', fontFamily: T.mono, fontSize: '0.75rem', fontWeight: 700 }}
                            >
                                {savingAttendance ? 'SAVING...' : 'SAVE ATTENDANCE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Attendance Modal */}
            {showMemberAttendance && selected && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, width: '100%', maxWidth: 500, padding: 30 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <h1 style={{ fontFamily: T.disp, fontSize: '2rem', color: T.hi, letterSpacing: '0.04em' }}>Member Attendance</h1>
                                <p style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.muted }}>{selected.user?.name}'s consistency track</p>
                            </div>
                            <button onClick={() => setShowMemberAttendance(false)} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>
                                <XMarkIcon style={{ width: 24 }} />
                            </button>
                        </div>
                        <AttendanceCalendar userId={selected.userId} />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </DashboardShell >
    );
}
