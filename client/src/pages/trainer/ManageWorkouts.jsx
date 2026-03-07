import React, { useEffect, useState } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import api from '../../utils/api';
import {
    ClockIcon,
    PencilSquareIcon,
    TrashIcon,
    PlusIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    UserIcon,
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

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

const InputField = ({ style, ...props }) => (
    <input {...props} style={{ background: '#0a0a0a', border: `1px solid ${T.border}`, borderRadius: 3, padding: '6px 10px', fontFamily: T.mono, fontSize: '0.75rem', color: T.text, outline: 'none', width: '100%', ...style }} />
);

const TextArea = ({ style, ...props }) => (
    <textarea {...props} style={{ background: '#0a0a0a', border: `1px solid ${T.border}`, borderRadius: 3, padding: '6px 10px', fontFamily: T.mono, fontSize: '0.72rem', color: T.text, outline: 'none', width: '100%', minHeight: 50, ...style }} />
);

const ModalLabel = ({ children }) => (
    <label style={{ display: 'block', fontFamily: T.mono, fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>{children}</label>
);

export default function ManageWorkouts() {
    const [pendingPlans, setPendingPlans] = useState([]);
    const [activePlans, setActivePlans] = useState([]);
    const [tab, setTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState(null);
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await api.get('/workouts/pending');
            setPendingPlans(res.data.plans);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchActive = async () => {
        setLoading(true);
        try {
            const res = await api.get('/workouts/active');
            setActivePlans(res.data.plans);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (tab === 'pending') fetchPending();
        else fetchActive();
    }, [tab]);

    const openEditor = async (planId) => {
        setLoading(true);
        try {
            const res = await api.get(`/workouts/plan/${planId}`);
            setEditingPlan(res.data.plan);
        } catch (err) { alert('Failed to load plan'); }
        finally { setLoading(false); }
    };

    const handleUpdateExercise = async (exId, data) => {
        try {
            await api.put(`/workouts/plan/${editingPlan.id}/exercise/${exId}`, data);
            // Update local state
            setEditingPlan({
                ...editingPlan,
                exercises: editingPlan.exercises.map(ex => ex.id === exId ? { ...ex, ...data } : ex),
                isTrainerEdited: true
            });
        } catch (err) { alert('Update failed'); }
    };

    const handleRemoveExercise = async (exId) => {
        if (!confirm('Remove exercise?')) return;
        try {
            await api.delete(`/workouts/plan/${editingPlan.id}/exercise/${exId}`);
            setEditingPlan({
                ...editingPlan,
                exercises: editingPlan.exercises.filter(ex => ex.id !== exId),
                isTrainerEdited: true
            });
        } catch (err) { alert('Remove failed'); }
    };

    const handleAddExercise = async (day) => {
        const newEx = {
            name: 'New Exercise',
            sets: 3,
            reps: '12',
            restTime: 60,
            instructions: 'Enter instructions...',
            targetMuscle: 'Various',
            day: day,
            dayTitle: editingPlan.exercises.find(e => e.day === day)?.dayTitle || `Day ${day}`,
            order: (editingPlan.exercises.filter(e => e.day === day).length)
        };
        try {
            const res = await api.post(`/workouts/plan/${editingPlan.id}/exercise`, newEx);
            openEditor(editingPlan.id); // Reload
        } catch (err) { alert('Add failed'); }
    };

    const finalizePlan = async () => {
        if (!confirm('Finalize this plan? It will be sent to the member.')) return;
        setSaving(true);
        try {
            await api.put(`/workouts/plan/${editingPlan.id}/finalize`);
            setEditingPlan(null);
            fetchPending();
        } catch (err) { alert('Finalize failed'); }
        finally { setSaving(false); }
    };

    return (
        <DashboardShell title="Review Workouts">
            <style>{`
                .m-fade { opacity:0; transform:translateY(10px); transition:all 0.4s ease; }
                .m-fade.in { opacity:1; transform:none; }
                .plan-card { background:${T.card}; border:1px solid ${T.border}; border-radius:4px; padding:16px; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; cursor:pointer; }
                .plan-card:hover { border-color:${T.accBorder}; background:#141414; }
                .editor-pane { position:fixed; inset:0; background:rgba(0,0,0,0.9); backdrop-filter:blur(10px); z-index:1000; display:flex; justifyContent:flex-end; }
                .editor-content { width:100%; maxWidth:900px; background:#0c0c0c; border-left:1px solid #222; height:100%; overflow-y:auto; padding:32px; }
                .ex-row { border:1px solid ${T.border}; background:#111; border-radius:6px; padding:16px; margin-bottom:12px; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className={`m-fade${mounted ? ' in' : ''}`}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: T.mono, fontSize: '0.52rem', color: T.acc, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>// staff portal</div>
                    <h1 style={{ fontFamily: T.disp, fontSize: '2.4rem', color: T.hi, letterSpacing: '0.04em', lineHeight: 1 }}>Manage Workouts</h1>
                    <div style={{ display: 'flex', gap: 20, marginTop: 15, borderBottom: `1px solid ${T.border}` }}>
                        <button
                            onClick={() => setTab('pending')}
                            style={{ background: 'none', border: 'none', padding: '10px 0', borderBottom: `2px solid ${tab === 'pending' ? T.acc : 'transparent'}`, color: tab === 'pending' ? T.hi : T.muted, fontFamily: T.mono, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}
                        >
                            PENDING REVIEW ({pendingPlans.length})
                        </button>
                        <button
                            onClick={() => setTab('active')}
                            style={{ background: 'none', border: 'none', padding: '10px 0', borderBottom: `2px solid ${tab === 'active' ? T.acc : 'transparent'}`, color: tab === 'active' ? T.hi : T.muted, fontFamily: T.mono, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}
                        >
                            ACTIVE PLANS ({activePlans.length})
                        </button>
                    </div>
                </div>

                {loading && !editingPlan ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><ArrowPathIcon style={{ width: 30, color: T.acc, animation: 'spin 1s linear infinite' }} /></div>
                ) : tab === 'pending' ? (
                    pendingPlans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 80, background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
                            <ClockIcon style={{ width: 40, color: T.faint, margin: '0 auto 12px' }} />
                            <div style={{ fontFamily: T.mono, fontSize: '0.8rem', color: T.muted }}>No pending plan requests</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {pendingPlans.map(plan => (
                                <div key={plan.id} className="plan-card" onClick={() => openEditor(plan.id)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 42, height: 42, background: T.accDim, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <UserIcon style={{ width: 20, color: T.acc }} />
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: T.disp, fontSize: '1.2rem', color: T.hi }}>{plan.member?.user?.name}</div>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.62rem', color: T.muted }}>Goal: {plan.request?.fitnessGoal || plan.goal} · Intensity: {plan.request?.intensity || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.amber, fontWeight: 700 }}>AI GENERATED</div>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.muted }}>{new Date(plan.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <ChevronRightIcon style={{ width: 18, color: T.faint }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    activePlans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 80, background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
                            <CheckCircleIcon style={{ width: 40, color: T.faint, margin: '0 auto 12px' }} />
                            <div style={{ fontFamily: T.mono, fontSize: '0.8rem', color: T.muted }}>No active workout plans</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {activePlans.map(plan => (
                                <div key={plan.id} className="plan-card" onClick={() => openEditor(plan.id)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 42, height: 42, background: T.greenDim, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CheckCircleIcon style={{ width: 20, color: T.green }} />
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: T.disp, fontSize: '1.2rem', color: T.hi }}>{plan.member?.user?.name}</div>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.62rem', color: T.muted }}>Goal: {plan.goal} · Level: {plan.difficulty}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.green, fontWeight: 700 }}>ACTIVE</div>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.muted }}>Last Updated: {new Date(plan.updatedAt).toLocaleDateString()}</div>
                                        </div>
                                        <ChevronRightIcon style={{ width: 18, color: T.faint }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
                {/* ── Editor Overlay ── */}
                {editingPlan && (
                    <div className="editor-pane">
                        <div className="editor-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                                <div>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.muted, display: 'flex', gap: 12, marginTop: 4 }}>
                                        <span>Goal: {editingPlan.request?.fitnessGoal || editingPlan.goal}</span>
                                        <span>Experience: {editingPlan.request?.experienceLevel || editingPlan.difficulty}</span>
                                        <span>Duration: {editingPlan.duration} Days</span>
                                    </div>
                                </div>
                                <button onClick={() => setEditingPlan(null)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><XMarkIcon style={{ width: 28 }} /></button>
                            </div>

                            {/* Member Request Context */}
                            {editingPlan.request && (
                                <div style={{ background: 'rgba(241,100,42,0.05)', border: `1px solid ${T.accBorder}`, borderRadius: 4, padding: 16, marginBottom: 32 }}>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.acc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>// member request context (plan entries)</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                                        {[
                                            ['Focus', editingPlan.request.targetFocus],
                                            ['Intensity', editingPlan.request.intensity],
                                            ['Days/Week', editingPlan.request.daysPerWeek],
                                            ['Session Time', `${editingPlan.request.sessionTime}m`],
                                        ].map(([l, v]) => (
                                            <div key={l}>
                                                <ModalLabel>{l}</ModalLabel>
                                                <div style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.text }}>{v || '—'}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <ModalLabel>Equipment Available</ModalLabel>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.text }}>{editingPlan.request.equipment?.join(', ') || 'No equipment specified'}</div>
                                        </div>
                                        <div>
                                            <ModalLabel>Injuries / Restrictions</ModalLabel>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.7rem', color: editingPlan.request.injuries ? '#ff6060' : T.muted }}>
                                                {editingPlan.request.injuries || 'None reported'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Exercises by Day */}
                            {[...Array(editingPlan.duration)].map((_, i) => {
                                const day = i + 1;
                                const dayExs = editingPlan.exercises.filter(ex => ex.day === day);
                                const dayTitle = dayExs[0]?.dayTitle || `Day ${day}`;

                                return (
                                    <div key={day} style={{ marginBottom: 32 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                            <div style={{ padding: '4px 12px', background: T.acc, color: '#fff', fontFamily: T.disp, fontSize: '1.2rem', borderRadius: 3 }}>Day {day}</div>
                                            <InputField
                                                value={dayTitle}
                                                onChange={e => {
                                                    const newTitle = e.target.value;
                                                    setEditingPlan({ ...editingPlan, exercises: editingPlan.exercises.map(ex => ex.day === day ? { ...ex, dayTitle: newTitle } : ex) });
                                                }}
                                                style={{ width: 200, fontFamily: T.disp, fontSize: '1.2rem', border: 'none', background: 'transparent', borderBottom: `1px solid ${T.faint}` }}
                                            />
                                            <button onClick={() => handleAddExercise(day)} style={{ background: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 3, padding: '4px 8px', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <PlusIcon style={{ width: 14 }} /> <span style={{ fontFamily: T.mono, fontSize: '0.6rem' }}>ADD</span>
                                            </button>
                                        </div>

                                        {dayExs.length === 0 ? (
                                            <div style={{ padding: 20, textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 4, fontFamily: T.mono, fontSize: '0.7rem', color: T.faint }}>Rest Day</div>
                                        ) : (
                                            dayExs.map(ex => (
                                                <div key={ex.id} className="ex-row">
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 12, marginBottom: 12 }}>
                                                        <div>
                                                            <ModalLabel>Exercise Name</ModalLabel>
                                                            <InputField value={ex.name} onChange={e => handleUpdateExercise(ex.id, { name: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <ModalLabel>Sets</ModalLabel>
                                                            <InputField type="number" value={ex.sets} onChange={e => handleUpdateExercise(ex.id, { sets: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <ModalLabel>Reps</ModalLabel>
                                                            <InputField value={ex.reps} onChange={e => handleUpdateExercise(ex.id, { reps: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <ModalLabel>Rest(s)</ModalLabel>
                                                            <InputField type="number" value={ex.restTime} onChange={e => handleUpdateExercise(ex.id, { restTime: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 40px', gap: 12 }}>
                                                        <div>
                                                            <ModalLabel>Target Muscle</ModalLabel>
                                                            <InputField value={ex.targetMuscle} onChange={e => handleUpdateExercise(ex.id, { targetMuscle: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <ModalLabel>Instructions</ModalLabel>
                                                            <TextArea value={ex.instructions} onChange={e => handleUpdateExercise(ex.id, { instructions: e.target.value })} />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 5 }}>
                                                            <button onClick={() => handleRemoveExercise(ex.id)} style={{ background: 'none', border: 'none', color: '#663333', cursor: 'pointer' }}><TrashIcon style={{ width: 18 }} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                );
                            })}

                            {/* Finalize Bar */}
                            <div style={{ position: 'sticky', bottom: 0, background: '#0c0c0c', padding: '20px 0', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
                                <button onClick={() => setEditingPlan(null)} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 3, color: T.muted, fontFamily: T.mono, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Discard Changes</button>
                                <button onClick={finalizePlan} disabled={saving} style={{ padding: '12px 32px', background: T.acc, border: 'none', borderRadius: 3, color: '#fff', fontFamily: T.mono, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {saving ? <ArrowPathIcon style={{ width: 18, animation: 'spin 1s linear infinite' }} /> : <><CheckCircleIcon style={{ width: 20 }} /> Finalize & Activate</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
