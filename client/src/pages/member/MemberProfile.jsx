import React, { useEffect, useState } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import api from '../../utils/api';
import {
    UserIcon, PhoneIcon, EnvelopeIcon, MapPinIcon,
    ScaleIcon, CalendarIcon, PencilIcon, CheckIcon,
    XMarkIcon, IdentificationIcon, BriefcaseIcon, FireIcon,
    ChevronDownIcon, ChevronRightIcon, StarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const T = {
    bg: '#080808', card: '#101010',
    border: '#1a1a1a', borderMid: '#252525',
    hi: '#efefef', text: '#c8c8c8', muted: '#484848', faint: '#1c1c1c',
    acc: '#f1642a', accDim: 'rgba(241,100,42,0.09)', accBorder: 'rgba(241,100,42,0.22)',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};
const SectionHead = ({ icon: Icon, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Icon style={{ width: 16, height: 16, color: T.acc, flexShrink: 0 }} />
        <span style={{ fontFamily: T.mono, fontSize: '0.52rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: T.acc }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
);

const RecordCard = ({ rec }) => {
    const [open, setOpen] = useState(false);
    const METRIC_GROUPS = [
        { g: 'Basic', rows: [['Weight', 'weight', 'kg'], ['Height', 'height', 'cm']] },
        {
            g: 'Circumference', rows: [
                ['Neck', 'neck', 'cm'], ['Shoulder', 'shoulder', 'cm'], ['Chest', 'chest', 'cm'],
                ['Upper Arm', 'upperArm', 'cm'], ['Forearm', 'forearm', 'cm'], ['Wrist', 'wrist', 'cm'],
                ['Waist', 'waist', 'cm'], ['Hips', 'hips', 'cm'], ['Thigh', 'thigh', 'cm'], ['Calf', 'calf', 'cm']
            ]
        },
        {
            g: 'BCA Report', rows: [
                ['Body Fat', 'bodyFat', '%'], ['Visceral Fat', 'visceralFat', ''],
                ['Resting Met.', 'restingMetabolism', 'kcal'], ['BMI', 'bmi', ''],
                ['Biol. Age', 'biologicalAge', 'yrs']
            ]
        },
    ];

    return (
        <div style={{ background: T.faint, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
            <div onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}>
                {open ? <ChevronDownIcon style={{ width: 14, color: T.acc }} /> : <ChevronRightIcon style={{ width: 14, color: T.muted }} />}
                <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, color: T.hi }}>
                        Assessment: {new Date(rec.measuredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>
            {open && (
                <div style={{ borderTop: `1px solid ${T.border}`, padding: '16px', background: 'rgba(0,0,0,0.15)' }}>
                    {METRIC_GROUPS.map(group => {
                        const filled = group.rows.filter(([, key]) => rec[key] !== null && rec[key] !== undefined);
                        if (!filled.length) return null;
                        return (
                            <div key={group.g} style={{ marginBottom: 14 }}>
                                <div style={{ fontFamily: T.mono, fontSize: '0.45rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.acc, marginBottom: 8 }}>{group.g}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                                    {filled.map(([label, key, unit]) => (
                                        <div key={key} style={{ background: T.card, borderRadius: 4, padding: '6px 10px', border: `1px solid ${T.border}` }}>
                                            <div style={{ fontFamily: T.mono, fontSize: '0.42rem', color: T.muted, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                                            <div style={{ fontFamily: T.disp, fontSize: '1.1rem', color: T.hi, lineHeight: 1 }}>
                                                {rec[key]}<span style={{ fontSize: '0.55rem', color: T.muted, marginLeft: 2 }}>{unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const InfoRow = ({ label, value, mono = false, edit = false, type = 'text', onChange }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontFamily: T.mono, fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: T.muted }}>{label}</div>
        {edit ? (
            <input
                type={type}
                value={value || ''}
                onChange={onChange}
                style={{
                    background: '#0a0a0a',
                    border: `1px solid ${T.borderMid}`,
                    borderRadius: 4,
                    padding: '6px 10px',
                    fontFamily: mono ? T.mono : 'inherit',
                    fontSize: '0.82rem',
                    color: T.hi,
                    outline: 'none',
                    width: '100%'
                }}
            />
        ) : (
            <div style={{ fontFamily: mono ? T.mono : 'inherit', fontSize: '0.85rem', color: value ? T.hi : T.muted }}>
                {value || '—'}
            </div>
        )}
    </div>
);

export default function MemberProfile() {
    const [profile, setProfile] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

    useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

    const fetchProfile = async () => {
        try {
            const [pRes, mRes] = await Promise.all([
                api.get('/member/profile'),
                api.get('/member/measurements')
            ]);
            setProfile(pRes.data.user);
            setMeasurements(mRes.data.measurements || []);
            setFormData({
                name: pRes.data.user.name,
                age: pRes.data.user.member?.age,
                gender: pRes.data.user.member?.gender,
                mobile: pRes.data.user.member?.mobile,
                address: pRes.data.user.member?.address,
                occupation: pRes.data.user.member?.occupation,
                height: pRes.data.user.member?.height,
                weight: pRes.data.user.member?.weight,
                fitnessGoal: pRes.data.user.member?.fitnessGoal,
            });
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/member/profile', formData);
            await fetchProfile();
            setIsEditing(false);
        } catch (err) {
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const updateF = (key) => (e) => setFormData(p => ({ ...p, [key]: e.target.value }));

    if (loading) return (
        <DashboardShell title="My Profile">
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                <div className="spinner" style={{ width: 24, height: 24 }} />
            </div>
        </DashboardShell>
    );

    const m = profile?.member || {};

    return (
        <DashboardShell title="My Profile">
            <style>{`
                .mp-fade { opacity:0; transform:translateY(12px); transition:all 0.4s ease; }
                .mp-fade.in { opacity:1; transform:none; }
                .mp-card { background:${T.card}; border:1px solid ${T.border}; border-radius:12px; padding:24px; }
            `}</style>

            <div className={`mp-fade${mounted ? ' in' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div>
                        <div style={{ fontFamily: T.mono, fontSize: '0.5rem', color: T.acc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>// profile view</div>
                        <h1 style={{ fontFamily: T.disp, fontSize: '2.4rem', color: T.hi, letterSpacing: '0.04em', lineHeight: 1 }}>
                            {profile.name}
                        </h1>
                        <p style={{ fontFamily: T.mono, fontSize: '0.65rem', color: T.muted, marginTop: 6 }}>
                            Member ID: <span style={{ color: T.hi }}>{m.memberNo}</span> · Active since {new Date(m.joinDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)}
                                    style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 16px', fontFamily: T.mono, fontSize: '0.7rem', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <XMarkIcon style={{ width: 14 }} /> Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    style={{ background: T.acc, border: 'none', borderRadius: 6, padding: '8px 20px', fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {saving ? 'Saving...' : <><CheckIcon style={{ width: 14 }} /> Save</>}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)}
                                style={{ background: T.accDim, border: `1px solid ${T.accBorder}`, borderRadius: 6, padding: '8px 20px', fontFamily: T.mono, fontSize: '0.7rem', fontWeight: 700, color: T.acc, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <PencilIcon style={{ width: 14 }} /> Edit Details
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Profile Photo & Basic */}
                        <div className="mp-card" style={{ textAlign: 'center' }}>
                            <div style={{ width: 110, height: 110, borderRadius: '50%', background: T.faint, border: `2px solid ${T.border}`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserIcon style={{ width: 44, color: T.muted }} />
                            </div>
                            <InfoRow label="Full Name" value={formData.name} edit={isEditing} onChange={updateF('name')} />
                            <div style={{ marginTop: 12 }}>
                                <InfoRow label="Email Address" value={profile.email} mono />
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="mp-card">
                            <SectionHead icon={PhoneIcon} label="Contact Details" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <InfoRow label="Phone Number" value={formData.mobile} edit={isEditing} onChange={updateF('mobile')} />
                                <InfoRow label="Residence Address" value={formData.address} edit={isEditing} onChange={updateF('address')} />
                                <InfoRow label="Occupation" value={formData.occupation} edit={isEditing} onChange={updateF('occupation')} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Membership Status */}
                        <div className="mp-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, background: `linear-gradient(135deg, ${T.card}, #120a05)` }}>
                            <div style={{ borderRight: `1px solid ${T.border}`, paddingRight: 20 }}>
                                <SectionHead icon={IdentificationIcon} label="Membership" />
                                <div style={{ fontFamily: T.disp, fontSize: '1.4rem', color: T.hi, textTransform: 'uppercase' }}>{m.membershipType}</div>
                                <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted, marginTop: 4 }}>Due: {m.membershipDueDate ? new Date(m.membershipDueDate).toLocaleDateString() : 'Lifetime'}</div>
                            </div>
                            <div style={{ borderRight: `1px solid ${T.border}`, paddingRight: 20 }}>
                                <SectionHead icon={BriefcaseIcon} label="Trainer" />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ fontFamily: T.hi, fontSize: '0.9rem', fontWeight: 600 }}>{m.trainer?.user?.name || 'Unassigned'}</div>
                                    {m.trainer?.user && (
                                        <button onClick={() => setShowFeedbackModal(true)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: '0.55rem', color: T.acc, textDecoration: 'underline', padding: 0 }}>
                                            REVIEW
                                        </button>
                                    )}
                                </div>
                                <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted, marginTop: 4 }}>Level 1 Personal Training</div>
                            </div>
                            <div>
                                <SectionHead icon={CalendarIcon} label="Preferences" />
                                <div style={{ fontFamily: T.hi, fontSize: '0.9rem', fontWeight: 600, textTransform: 'capitalize' }}>{m.sessionTime || 'Not set'}</div>
                                <div style={{ fontFamily: T.mono, fontSize: '0.6rem', color: T.muted, marginTop: 4 }}>Availability: Morning/Evening</div>
                            </div>
                        </div>

                        {/* Physical & Fitness */}
                        <div className="mp-card">
                            <SectionHead icon={ScaleIcon} label="Body Stats & Fitness" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                                <InfoRow label="Age" value={formData.age} edit={isEditing} type="number" onChange={updateF('age')} />
                                <InfoRow label="Gender" value={formData.gender} edit={isEditing} onChange={updateF('gender')} />
                                <InfoRow label="Height (cm)" value={formData.height} edit={isEditing} type="number" onChange={updateF('height')} />
                                <InfoRow label="Weight (kg)" value={formData.weight} edit={isEditing} type="number" onChange={updateF('weight')} />
                            </div>
                            <div style={{ marginTop: 24 }}>
                                <InfoRow label="Fitness Goal" value={formData.fitnessGoal} edit={isEditing} onChange={updateF('fitnessGoal')} />
                            </div>
                        </div>

                        {/* Activity */}
                        <div className="mp-card">
                            <SectionHead icon={FireIcon} label="Gym Activity" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div style={{ background: T.faint, padding: 16, borderRadius: 8 }}>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.5rem', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>Last Visit</div>
                                    <div style={{ fontFamily: T.disp, fontSize: '1.2rem', color: T.hi }}>{m.lastAttendance ? new Date(m.lastAttendance).toLocaleDateString() : 'Never'}</div>
                                </div>
                                <div style={{ background: T.faint, padding: 16, borderRadius: 8 }}>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.5rem', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>Workouts Generated</div>
                                    <div style={{ fontFamily: T.disp, fontSize: '1.2rem', color: T.hi }}>{profile.workoutRequests?.length || 0} Plans</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Measurements */}
                        <div className="mp-card">
                            <SectionHead icon={ScaleIcon} label="Measurement History" />
                            {measurements.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: T.mono, fontSize: '0.65rem', color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
                                    No body assessments recorded yet.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {measurements.slice(0, 3).map(rec => (
                                        <RecordCard key={rec.id} rec={rec} />
                                    ))}
                                    {measurements.length > 3 && (
                                        <div style={{ textAlign: 'center', marginTop: 10 }}>
                                            <a href="/progress" style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.acc, textDecoration: 'none', letterSpacing: '0.1em' }}>VIEW ALL ANALYTICS & TRENDS →</a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Feedback Modal */}
                {showFeedbackModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                        <div style={{ background: T.card, border: `1px solid ${T.borderMid}`, borderRadius: 12, width: '100%', maxWidth: 400, overflow: 'hidden', animation: 'mp-fade 0.2s ease forwards' }}>
                            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontFamily: T.disp, fontSize: '1.4rem', color: T.hi }}>Give Feedback</div>
                                <button onClick={() => setShowFeedbackModal(false)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><XMarkIcon style={{ width: 20 }} /></button>
                            </div>
                            <div style={{ padding: 24 }}>
                                <div style={{ fontFamily: T.mono, fontSize: '0.52rem', color: T.muted, textTransform: 'uppercase', marginBottom: 16 }}>Rating for {m.trainer?.user?.name}</div>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                            <StarIcon style={{ width: 32, height: 32, color: star <= feedbackForm.rating ? '#ffb400' : T.faint, fill: star <= feedbackForm.rating ? '#ffb400' : 'none', transition: 'all 0.15s' }} />
                                        </button>
                                    ))}
                                </div>
                                <label style={{ display: 'block', fontFamily: T.mono, fontSize: '0.52rem', color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>Comment (Optional)</label>
                                <textarea
                                    value={feedbackForm.comment}
                                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                                    placeholder="Tell us about your experience..."
                                    style={{ background: '#0a0a0a', border: `1px solid ${T.borderMid}`, borderRadius: 6, padding: '12px', fontFamily: T.mono, fontSize: '0.75rem', color: T.text, outline: 'none', width: '100%', minHeight: 100, resize: 'none' }}
                                />
                                <button
                                    onClick={async () => {
                                        setSaving(true);
                                        try {
                                            await api.post(`/member/review/${m.trainerId}`, feedbackForm);
                                            toast.success('Review submitted! Thank you.');
                                            setShowFeedbackModal(false);
                                            setFeedbackForm({ rating: 5, comment: '' });
                                        } catch (e) {
                                            toast.error('Failed to submit review');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving}
                                    style={{ width: '100%', marginTop: 24, background: T.acc, border: 'none', borderRadius: 6, padding: '12px', fontFamily: T.mono, fontSize: '0.75rem', fontWeight: 700, color: '#fff', cursor: 'pointer', textTransform: 'uppercase' }}>
                                    {saving ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
