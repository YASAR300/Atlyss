import React, { useEffect, useState } from 'react';
import DashboardShell from '../components/layout/DashboardShell';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    ClockIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    ExclamationCircleIcon,
    ArrowPathIcon,
    SparklesIcon,
    ChevronRightIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

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

const BLANK_REQUEST = {
    fitnessGoal: 'Muscle Gain',
    experienceLevel: 'Intermediate',
    planDuration: 7,
    targetFocus: 'Full Body',
    daysPerWeek: 3,
    sessionTime: 60,
    equipment: ['Dumbbells', 'Machines'],
    intensity: 'Moderate',
    recoveryOption: 'Stretching',
    injuries: ''
};

const GOALS = ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'Flexibility', 'Cardio'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const FOCUS = ['Full Body', 'Upper Body', 'Lower Body', 'Chest', 'Back', 'Arms', 'Legs', 'Core'];
const EQUIPMENT = ['Dumbbells', 'Barbell', 'Machines', 'Resistance Bands', 'Bodyweight Only'];

const InputField = ({ style, ...props }) => (
    <input {...props} style={{ background: '#0a0a0a', border: `1px solid ${T.border}`, borderRadius: 3, padding: '8px 11px', fontFamily: T.mono, fontSize: '0.75rem', color: T.text, outline: 'none', width: '100%', ...style }} />
);

const SelectField = ({ style, children, ...props }) => (
    <select {...props} style={{ background: '#0a0a0a', border: `1px solid ${T.border}`, borderRadius: 3, padding: '8px 10px', fontFamily: T.mono, fontSize: '0.75rem', color: T.text, outline: 'none', cursor: 'pointer', appearance: 'none', width: '100%', ...style }}>{children}</select>
);

const TextArea = ({ style, ...props }) => (
    <textarea {...props} style={{ background: '#0a0a0a', border: `1px solid ${T.border}`, borderRadius: 3, padding: '8px 11px', fontFamily: T.mono, fontSize: '0.75rem', color: T.text, outline: 'none', width: '100%', resize: 'vertical', minHeight: 60, ...style }} />
);

const ModalLabel = ({ children }) => (
    <label style={{ display: 'block', fontFamily: T.mono, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, marginBottom: 5 }}>{children}</label>
);

export default function Workouts() {
    const { user } = useAuth();
    const isMember = user?.role === 'member';

    const [activePlan, setActivePlan] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestForm, setRequestForm] = useState(BLANK_REQUEST);
    const [activeDay, setActiveDay] = useState(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const res = await api.get('/workouts/my-plan');
            setActivePlan(res.data.plan);
            setIsPending(res.data.isPending);
        } catch (err) {
            console.error('Fetch plan error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (isMember) fetchPlan(); }, [isMember]);

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            await api.post('/workouts/request', requestForm);
            setShowRequestForm(false);
            fetchPlan();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setGenerating(false);
        }
    };

    const handleEquipmentChange = (item) => {
        const current = [...requestForm.equipment];
        if (current.includes(item)) {
            setRequestForm({ ...requestForm, equipment: current.filter(i => i !== item) });
        } else {
            setRequestForm({ ...requestForm, equipment: [...current, item] });
        }
    };

    if (!isMember) {
        return (
            <DashboardShell title="Workouts">
                <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: T.mono, color: T.muted }}>
                    Access this page as a Member to view and request workout plans.
                </div>
            </DashboardShell>
        );
    }

    const currentDayExercises = activePlan?.exercises?.filter(ex => ex.day === activeDay) || [];

    return (
        <DashboardShell title="Workouts">
            <style>{`
                .w-fade { opacity:0; transform:translateY(10px); transition:all 0.4s ease; }
                .w-fade.in { opacity:1; transform:none; }
                .day-btn { padding:10px 16px; border:1px solid ${T.border}; border-radius:4px; fontFamily:${T.mono}; fontSize:0.75rem; color:${T.muted}; cursor:pointer; background:transparent; transition:0.15s; text-transform:uppercase; font-weight:700; }
                .day-btn.active { border-color:${T.acc}; color:${T.acc}; background:${T.accDim}; }
                .exercise-card { background:${T.card}; border:1px solid ${T.border}; border-radius:6px; padding:18px; margin-bottom:12px; display:flex; gap:20px; transition:0.15s; }
                .exercise-card:hover { border-color:${T.borderMid}; background:#141414; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .pulse { animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity:0.6; } 50% { opacity:1; } 100% { opacity:0.6; } }
            `}</style>

            <div className={`w-fade${mounted ? ' in' : ''}`}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                    <div>
                        <div style={{ fontFamily: T.mono, fontSize: '0.52rem', color: T.acc, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>// personal training</div>
                        <h1 style={{ fontFamily: T.disp, fontSize: '2.4rem', color: T.hi, letterSpacing: '0.04em', lineHeight: 1 }}>Workout Plan</h1>
                        {activePlan && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                                <span style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.text, fontWeight: 700 }}>{activePlan.name}</span>
                                <span style={{ padding: '2px 8px', borderRadius: 2, fontSize: '0.52rem', fontFamily: T.mono, fontWeight: 700, textTransform: 'uppercase', background: isPending ? T.amberDim : T.greenDim, border: `1px solid ${isPending ? T.amberBorder : T.greenBorder}`, color: isPending ? T.amber : T.green }}>
                                    {isPending ? 'Pending Review' : 'Active'}
                                </span>
                            </div>
                        )}
                    </div>
                    {!activePlan && !loading && (
                        <button onClick={() => setShowRequestForm(true)} style={{ background: T.acc, border: 'none', borderRadius: 3, padding: '10px 20px', fontFamily: T.disp, fontSize: '1.1rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: '0.15s' }}>
                            <SparklesIcon style={{ width: 18 }} /> Create Plan
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><ArrowPathIcon style={{ width: 30, color: T.acc, animation: 'spin 1s linear infinite' }} /></div>
                ) : activePlan ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 30 }}>
                        {/* Sidebar */}
                        <div>
                            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
                                <ModalLabel>Goal</ModalLabel>
                                <div style={{ fontFamily: T.disp, fontSize: '1.4rem', color: T.hi, marginBottom: 12 }}>{activePlan.goal}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div><ModalLabel>Duration</ModalLabel><div style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.text }}>{activePlan.duration} Days</div></div>
                                    <div><ModalLabel>Level</ModalLabel><div style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.text }}>{activePlan.difficulty}</div></div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[...Array(activePlan.duration)].map((_, i) => (
                                    <button key={i} onClick={() => setActiveDay(i + 1)} className={`day-btn ${activeDay === i + 1 ? 'active' : ''}`}>
                                        Day {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Exercises List */}
                        <div>
                            {isPending && (
                                <div style={{ background: T.amberDim, border: `1px solid ${T.amberBorder}`, borderRadius: 4, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                    <ExclamationCircleIcon style={{ width: 20, color: T.amber }} />
                                    <div style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.amber }}>This plan is AI-generated and awaiting review from your trainer. Instructions may vary after finalization.</div>
                                </div>
                            )}

                            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontFamily: T.disp, fontSize: '1.6rem', color: T.hi, letterSpacing: '0.04em' }}>
                                    {currentDayExercises[0]?.dayTitle || `Day ${activeDay}`}
                                </h2>
                                <span style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.muted }}>{currentDayExercises.length} Exercises</span>
                            </div>

                            {currentDayExercises.length === 0 ? (
                                <div style={{ padding: 60, textAlign: 'center', background: T.card, border: `1px dashed ${T.border}`, borderRadius: 6 }}>
                                    <ClockIcon style={{ width: 40, color: T.faint, margin: '0 auto 12px' }} />
                                    <div style={{ fontFamily: T.mono, fontSize: '0.75rem', color: T.muted }}>Rest Day — Recovery and proper nutrition are essential.</div>
                                </div>
                            ) : currentDayExercises.map((ex) => (
                                <div key={ex.id} className="exercise-card">
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                            <h3 style={{ fontFamily: T.disp, fontSize: '1.3rem', color: T.hi, letterSpacing: '0.03em' }}>{ex.name}</h3>
                                            <span style={{ fontSize: '0.55rem', fontFamily: T.mono, background: T.accDim, color: T.acc, padding: '2px 8px', borderRadius: 2, fontWeight: 700, textTransform: 'uppercase' }}>{ex.targetMuscle}</span>
                                        </div>
                                        <p style={{ fontFamily: T.mono, fontSize: '0.7rem', color: T.text, lineHeight: 1.5, marginBottom: 12 }}>{ex.instructions}</p>
                                        <div style={{ display: 'flex', gap: 14 }}>
                                            <div><ModalLabel>Rest</ModalLabel><div style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.muted }}>{ex.restTime}s</div></div>
                                            {activePlan.isTrainerEdited && <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.55rem', fontFamily: T.mono, color: T.green }}><CheckCircleIcon style={{ width: 12 }} /> PRO VERIFIED</div>}
                                        </div>
                                    </div>
                                    <div style={{ width: 90, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ background: '#161616', borderRadius: 4, padding: '10px 0', textAlign: 'center', border: `1px solid ${T.border}` }}>
                                            <div style={{ fontFamily: T.disp, fontSize: '1.8rem', color: T.acc, lineHeight: 1 }}>{ex.sets}</div>
                                            <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', marginTop: 2 }}>Sets</div>
                                        </div>
                                        <div style={{ background: '#161616', borderRadius: 4, padding: '10px 0', textAlign: 'center', border: `1px solid ${T.border}` }}>
                                            <div style={{ fontFamily: T.disp, fontSize: '1.8rem', color: T.hi, lineHeight: 1 }}>{ex.reps}</div>
                                            <div style={{ fontSize: '0.55rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', marginTop: 2 }}>Reps</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '100px 0', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                        <SparklesIcon style={{ width: 48, color: T.acc, margin: '0 auto 20px', opacity: 0.4 }} />
                        <h2 style={{ fontFamily: T.disp, fontSize: '2rem', color: T.hi, marginBottom: 8 }}>No Active Plan</h2>
                        <p style={{ fontFamily: T.mono, fontSize: '0.8rem', color: T.muted, maxWidth: 400, margin: '0 auto 24px' }}>Submit your fitness goals and health metrics to generate a personalized weekly workout routine.</p>
                        <button onClick={() => setShowRequestForm(true)} style={{ background: T.hi, color: '#000', border: 'none', borderRadius: 3, padding: '10px 28px', fontFamily: T.mono, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', transition: '0.15s' }}>Start Generation</button>
                    </div>
                )}

                {/* ── Request Modal ── */}
                {showRequestForm && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 32, boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <div>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.acc, letterSpacing: '0.2em', textTransform: 'uppercase' }}>// workout engine</div>
                                    <h2 style={{ fontFamily: T.disp, fontSize: '2rem', color: T.hi, letterSpacing: '0.04em' }}>Generate Personalized Plan</h2>
                                </div>
                                <button onClick={() => setShowRequestForm(false)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><XMarkIcon style={{ width: 24 }} /></button>
                            </div>

                            <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <ModalLabel>Fitness Goal</ModalLabel>
                                        <SelectField value={requestForm.fitnessGoal} onChange={e => setRequestForm({ ...requestForm, fitnessGoal: e.target.value })}>
                                            {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </SelectField>
                                    </div>
                                    <div>
                                        <ModalLabel>Experience Level</ModalLabel>
                                        <SelectField value={requestForm.experienceLevel} onChange={e => setRequestForm({ ...requestForm, experienceLevel: e.target.value })}>
                                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </SelectField>
                                    </div>
                                    <div>
                                        <ModalLabel>Target Focus</ModalLabel>
                                        <SelectField value={requestForm.targetFocus} onChange={e => setRequestForm({ ...requestForm, targetFocus: e.target.value })}>
                                            {FOCUS.map(f => <option key={f} value={f}>{f}</option>)}
                                        </SelectField>
                                    </div>
                                    <div>
                                        <ModalLabel>Workout Days / Week</ModalLabel>
                                        <SelectField value={requestForm.daysPerWeek} onChange={e => setRequestForm({ ...requestForm, daysPerWeek: e.target.value })}>
                                            {[2, 3, 4, 5, 6].map(d => <option key={d} value={d}>{d} Days</option>)}
                                        </SelectField>
                                    </div>
                                    <div>
                                        <ModalLabel>Session Duration (Min)</ModalLabel>
                                        <SelectField value={requestForm.sessionTime} onChange={e => setRequestForm({ ...requestForm, sessionTime: e.target.value })}>
                                            {[30, 45, 60, 90, 120].map(t => <option key={t} value={t}>{t} Minutes</option>)}
                                        </SelectField>
                                    </div>
                                    <div>
                                        <ModalLabel>Intensity</ModalLabel>
                                        <SelectField value={requestForm.intensity} onChange={e => setRequestForm({ ...requestForm, intensity: e.target.value })}>
                                            <option value="Low">Low</option>
                                            <option value="Moderate">Moderate</option>
                                            <option value="High">High</option>
                                        </SelectField>
                                    </div>
                                </div>

                                <div>
                                    <ModalLabel>Available Equipment</ModalLabel>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {EQUIPMENT.map(eq => (
                                            <button key={eq} type="button" onClick={() => handleEquipmentChange(eq)} style={{ background: requestForm.equipment.includes(eq) ? T.accDim : 'transparent', border: `1px solid ${requestForm.equipment.includes(eq) ? T.acc : T.border}`, borderRadius: 20, padding: '5px 14px', fontFamily: T.mono, fontSize: '0.6rem', color: requestForm.equipment.includes(eq) ? T.acc : T.muted, cursor: 'pointer', transition: '0.15s' }}>
                                                {eq}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <ModalLabel>Injuries or Restrictions (If any)</ModalLabel>
                                    <TextArea value={requestForm.injuries} onChange={e => setRequestForm({ ...requestForm, injuries: e.target.value })} placeholder="e.g. Knee injury, Lower back pain..." />
                                </div>

                                <div style={{ padding: '16px 20px', background: T.accDim, borderRadius: 4, borderLeft: `3px solid ${T.acc}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                        <SparklesIcon style={{ width: 14, color: T.acc }} className="pulse" />
                                        <span style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.acc, fontWeight: 700, letterSpacing: '0.05em' }}>GEMINI 2.5 FLASH + QDRANT ACTIVE</span>
                                    </div>
                                    <div style={{ fontSize: '0.62rem', fontFamily: T.mono, color: T.text, lineHeight: 1.4 }}>Our high-reasoning engine will analyze your metrics and historical training patterns from our vector database to build an optimal strategy.</div>
                                </div>

                                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                                    <button type="button" onClick={() => setShowRequestForm(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 3, color: T.muted, fontFamily: T.mono, textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" disabled={generating} style={{ flex: 2, padding: '12px', background: T.acc, border: 'none', borderRadius: 3, color: '#fff', fontFamily: T.mono, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                        {generating ? <ArrowPathIcon style={{ width: 16, animation: 'spin 1s linear infinite' }} /> : 'Generate My Strategy'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
