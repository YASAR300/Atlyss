import React, { useEffect, useState } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip
} from 'chart.js';
import { ClipboardDocumentListIcon, CalendarIcon, CheckCircleIcon, FireIcon } from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const GOAL_LABELS = { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', endurance: 'Endurance' };

// Group WorkoutExercise list by day-name (day 1 = Monday, etc.)
const groupByDay = (exercises = []) =>
    DAYS.reduce((acc, name, idx) => {
        acc[name] = exercises.filter(ex => ex.day === idx + 1);
        return acc;
    }, {});

export default function MemberDashboard() {
    const { user } = useAuth();
    const [grouped, setGrouped] = useState({});
    const [activePlan, setActivePlan] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [classes, setClasses] = useState([]);
    const [activeDay, setActiveDay] = useState('Monday');
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    useEffect(() => {
        Promise.all([
            api.get('/member/workouts'),
            api.get('/member/attendance'),
            api.get('/member/classes'),
        ]).then(([w, a, c]) => {
            // API returns { plans: [...] }, pick the best plan
            const plans = w.data.plans || [];
            const best = plans.find(p => p.status === 'active') || plans.find(p => p.status === 'pending') || null;
            setActivePlan(best);
            setGrouped(best ? groupByDay(best.exercises) : {});
            setAttendance(a.data.attendance || []);
            setClasses(c.data.classes || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const totalExercises = Object.values(grouped).reduce((s, d) => s + d.length, 0);

    const last7Labels = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toLocaleDateString('en-US', { weekday: 'short' }); });
    const attendanceCounts = last7Labels.map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return attendance.filter(a => new Date(a.checkinTime).toDateString() === d.toDateString()).length;
    });

    const chartData = {
        labels: last7Labels,
        datasets: [{
            data: attendanceCounts,
            backgroundColor: 'rgba(255,80,20,0.18)',
            borderColor: '#ff5020',
            borderWidth: 2,
            borderRadius: 6,
        }]
    };
    const chartOpts = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.3)', stepSize: 1, font: { size: 10 } } },
        },
    };

    const bookClass = async (id) => {
        setBooking(id);
        try { await api.post(`/member/classes/${id}/book`); const r = await api.get('/member/classes'); setClasses(r.data.classes); }
        catch (e) { console.error(e); } finally { setBooking(null); }
    };

    if (loading) return <DashboardShell title="Dashboard"><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div></DashboardShell>;

    const todayPlan = grouped[activeDay] || [];

    return (
        <DashboardShell title="Dashboard">
            <div className={`fade-up ${mounted ? 'visible' : ''}`}>
                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                    <h1 className="page-title">My Dashboard</h1>
                    <p className="page-subtitle">
                        {user?.member?.trainer?.user?.name ? (
                            <span style={{ color: '#fff' }}>Assigned Trainer: <span style={{ color: '#ff6020' }}>{user.member.trainer.user.name}</span></span>
                        ) : (
                            GOAL_LABELS[user?.member?.fitnessGoal] || 'Your fitness journey'
                        )}
                    </p>
                </div>

                {/* Plan status banner */}
                {activePlan?.status === 'pending' && (
                    <div style={{ background: 'rgba(208,152,48,0.08)', border: '1px solid rgba(208,152,48,0.25)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ClipboardDocumentListIcon style={{ width: 18, height: 18, color: '#d09830', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d09830' }}>Your AI Workout Plan is Pending Trainer Review</div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(208,152,48,0.6)', marginTop: 2 }}>Your trainer will review and finalize the plan. It will appear below once approved.</div>
                        </div>
                    </div>
                )}
                {activePlan?.status === 'active' && (
                    <div style={{ background: 'rgba(77,168,112,0.07)', border: '1px solid rgba(77,168,112,0.22)', borderRadius: 10, padding: '10px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircleIcon style={{ width: 16, height: 16, color: '#4da870', flexShrink: 0 }} />
                        <div style={{ fontSize: '0.72rem', color: '#4da870', fontWeight: 600 }}>Active Plan: {activePlan.name}</div>
                    </div>
                )}

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
                    {[
                        { label: 'Exercises', val: totalExercises, icon: ClipboardDocumentListIcon, c: '#ff5020' },
                        { label: 'Check-ins', val: attendance.length, icon: CheckCircleIcon, c: '#4ade80' },
                        { label: 'Classes', val: classes.length, icon: CalendarIcon, c: '#7ba3ff' },
                        { label: 'Goal', val: GOAL_LABELS[user?.member?.fitnessGoal]?.split(' ')[0], icon: FireIcon, c: '#fb923c' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <s.icon style={{ width: 20, height: 20, color: s.c, flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div className="stat-label">{s.label}</div>
                                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.6rem', color: s.c, lineHeight: 1, marginTop: 2 }}>{s.val}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                    {/* Workout plan */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="section-title" style={{ marginBottom: 12, display: 'block' }}>Weekly Plan</span>
                            {/* Day tabs */}
                            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                                {DAYS.map(d => (
                                    <button key={d} onClick={() => setActiveDay(d)} className={`day-tab ${activeDay === d ? 'active' : ''}`}>{d.slice(0, 3)}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {totalExercises === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.18)' }}>
                                    <ClipboardDocumentListIcon style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.2 }} />
                                    <p style={{ fontSize: '0.85rem' }}>No workout plan yet. Ask your trainer!</p>
                                </div>
                            ) : todayPlan.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '36px 20px', color: 'rgba(255,255,255,0.25)', fontSize: '0.9rem' }}>💤 Rest day</div>
                            ) : todayPlan.map(ex => (
                                <div key={ex.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{ex.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 3, textTransform: 'capitalize' }}>{ex.targetMuscle}</div>
                                        {ex.instructions && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ex.instructions}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                        {[{ v: ex.sets, l: 'Sets', c: '#ff5020' }, { v: ex.reps, l: 'Reps', c: '#fb923c' }].map(b => (
                                            <div key={b.l} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                                                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.5rem', color: b.c, lineHeight: 1 }}>{b.v}</div>
                                                <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{b.l}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Side column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Chart */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18 }}>
                            <span className="section-title" style={{ display: 'block', marginBottom: 14 }}>Attendance</span>
                            <Bar data={chartData} options={chartOpts} height={130} />
                        </div>

                        {/* Classes */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', flex: 1 }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <span className="section-title">Classes</span>
                            </div>
                            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                                {classes.slice(0, 5).map(cls => {
                                    const spots = cls.capacity - (cls._count?.attendance || 0);
                                    return (
                                        <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 10, gap: 8 }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.className}</div>
                                                <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{new Date(cls.scheduleTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <button onClick={() => bookClass(cls.id)} disabled={spots <= 0 || booking === cls.id}
                                                className="btn btn-primary btn-sm" style={{ flexShrink: 0, padding: '5px 12px', fontSize: '0.72rem', opacity: spots <= 0 ? 0.4 : 1 }}>
                                                {booking === cls.id ? <span className="spinner" /> : spots <= 0 ? 'Full' : 'Book'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
