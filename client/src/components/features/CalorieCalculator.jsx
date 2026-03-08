import React, { useState, useEffect } from 'react';
import {
    CalculatorIcon,
    FireIcon,
    BeakerIcon,
    SparklesIcon,
    ArrowPathIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const T = {
    bg: '#080808', card: '#111',
    border: '#222',
    hi: '#fff', text: '#aaa', muted: '#444',
    acc: '#f1642a',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

const CalorieCalculator = () => {
    const [inputs, setInputs] = useState({
        age: 25,
        gender: 'male',
        height: 175,
        weight: 70,
        activity: 'moderate',
        goal: 'maintenance',
        targetWeightChange: 0.5, // kg/week
        bodyFat: '',
    });

    const [results, setResults] = useState(null);

    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
        extra_active: 2.2
    };

    const calculate = () => {
        const { age, gender, height, weight, activity, goal } = inputs;

        // Mifflin-St Jeor Equation
        let bmr;
        if (gender === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        const tdee = bmr * activityMultipliers[activity];

        const goals = {
            maintenance: { label: 'Maintain Weight', cals: Math.round(tdee), pct: 100 },
            mild_loss: { label: 'Mild Weight Loss (0.25kg/wk)', cals: Math.round(tdee - 250), pct: 91 },
            weight_loss: { label: 'Weight Loss (0.5kg/wk)', cals: Math.round(tdee - 500), pct: 83 },
            extreme_loss: { label: 'Extreme Weight Loss (1kg/wk)', cals: Math.round(tdee - 1000), pct: 65 },
            mild_gain: { label: 'Mild Weight Gain (0.25kg/wk)', cals: Math.round(tdee + 250), pct: 109 },
            weight_gain: { label: 'Weight Gain (0.5kg/wk)', cals: Math.round(tdee + 500), pct: 117 },
        };

        const currentGoalCals = goals[goal]?.cals || Math.round(tdee);

        // Nutrition Breakdown (approximate ratios based on fitness goal)
        let pPct = 0.25, cPct = 0.5, fPct = 0.25;
        if (goal.includes('loss')) { pPct = 0.35; cPct = 0.4; fPct = 0.25; }
        if (goal.includes('gain')) { pPct = 0.25; cPct = 0.55; fPct = 0.2; }

        const macros = {
            protein: Math.round((currentGoalCals * pPct) / 4),
            carbs: Math.round((currentGoalCals * cPct) / 4),
            fats: Math.round((currentGoalCals * fPct) / 9),
            fiber: Math.round((currentGoalCals / 1000) * 14),
            water: (weight * 0.035).toFixed(1)
        };

        setResults({
            maintenance: goals.maintenance,
            current: goals[goal],
            options: [goals.mild_loss, goals.weight_loss, goals.mild_gain, goals.weight_gain],
            macros
        });
    };

    useEffect(() => {
        calculate();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, fontFamily: T.mono, color: T.hi }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <CalculatorIcon style={{ width: 24, color: T.acc }} />
                <h2 style={{ fontFamily: T.disp, fontSize: '1.8rem', letterSpacing: '0.05em', margin: 0 }}>CALORIE CALCULATOR</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: 32 }}>

                {/* Inputs Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: T.text, marginBottom: 8, textTransform: 'uppercase' }}>Stats</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <input name="age" type="number" value={inputs.age} onChange={handleChange} placeholder="Age" style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: 4, fontSize: '0.8rem' }} />
                            <select name="gender" value={inputs.gender} onChange={handleChange} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: 4, fontSize: '0.8rem' }}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', color: T.text, marginBottom: 8, textTransform: 'uppercase' }}>Height (cm)</label>
                            <input name="height" type="number" value={inputs.height} onChange={handleChange} style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: 4, fontSize: '0.8rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', color: T.text, marginBottom: 8, textTransform: 'uppercase' }}>Weight (kg)</label>
                            <input name="weight" type="number" value={inputs.weight} onChange={handleChange} style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: 4, fontSize: '0.8rem' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: T.text, marginBottom: 8, textTransform: 'uppercase' }}>Activity Level</label>
                        <select name="activity" value={inputs.activity} onChange={handleChange} style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: 4, fontSize: '0.8rem' }}>
                            <option value="sedentary">Sedentary (No exercise)</option>
                            <option value="light">Light (1-3 times/week)</option>
                            <option value="moderate">Moderate (4-5 times/week)</option>
                            <option value="active">Active (Daily intense)</option>
                            <option value="very_active">Very Active (Intense 6-7/week)</option>
                            <option value="extra_active">Extra Active (Very intense/job)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', color: T.text, marginBottom: 8, textTransform: 'uppercase' }}>Fitness Goal</label>
                        <select name="goal" value={inputs.goal} onChange={handleChange} style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: 4, fontSize: '0.8rem' }}>
                            <option value="maintenance">Maintain Weight</option>
                            <option value="mild_loss">Mild Weight Loss</option>
                            <option value="weight_loss">Weight Loss</option>
                            <option value="extreme_loss">Fat Loss (Extreme)</option>
                            <option value="mild_gain">Mild Weight Gain</option>
                            <option value="weight_gain">Weight Gain</option>
                            <option value="extreme_gain">Muscle Gain (Bulking)</option>
                        </select>
                    </div>

                    <button onClick={calculate} style={{ marginTop: 8, background: T.acc, color: '#fff', border: 'none', padding: '12px', borderRadius: 4, cursor: 'pointer', fontFamily: T.disp, fontSize: '1rem', letterSpacing: '0.05em' }}>CALCULATE DAILY INTAKE</button>
                </div>

                {/* Results Section */}
                {results && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Summary Card */}
                        <div style={{ background: 'rgba(255,100,0,0.05)', border: `1px solid ${T.acc}33`, borderRadius: 8, padding: 20, textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: T.acc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>Recommended Daily Calories</div>
                            <div style={{ fontFamily: T.disp, fontSize: '4rem', color: '#fff', lineHeight: 1 }}>{results.current.cals}</div>
                            <div style={{ fontSize: '0.8rem', color: T.text, marginTop: 10 }}>kcal / day ({results.current.label})</div>
                        </div>

                        {/* Breakdown Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                            {/* Calories Options */}
                            <div style={{ background: '#161616', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
                                    <FireIcon style={{ width: 14, color: '#ffbd2e' }} />
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: T.text }}>Calorie Estimates</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: T.hi }}>Maintenance</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{results.maintenance.cals} <span style={{ color: T.muted, fontWeight: 400, fontSize: '0.6rem' }}>100%</span></span>
                                    </div>
                                    {results.options.map((opt, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: T.text }}>{opt.label.split('(')[0]}</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{opt.cals} <span style={{ color: T.muted, fontWeight: 400, fontSize: '0.6rem' }}>{opt.pct}%</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nutrition Breakdown */}
                            <div style={{ background: '#161616', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
                                    <BeakerIcon style={{ width: 14, color: '#4da870' }} />
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: T.text }}>Nutrition Goals</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: '0.55rem', color: T.muted, textTransform: 'uppercase' }}>Protein</div>
                                        <div style={{ fontSize: '0.9rem', color: T.hi }}>{results.macros.protein}g</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.55rem', color: T.muted, textTransform: 'uppercase' }}>Carbs</div>
                                        <div style={{ fontSize: '0.9rem', color: T.hi }}>{results.macros.carbs}g</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.55rem', color: T.muted, textTransform: 'uppercase' }}>Fats</div>
                                        <div style={{ fontSize: '0.9rem', color: T.hi }}>{results.macros.fats}g</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.55rem', color: T.muted, textTransform: 'uppercase' }}>Fiber</div>
                                        <div style={{ fontSize: '0.9rem', color: T.hi }}>{results.macros.fiber}g</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 15, paddingTop: 10, borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.6rem', color: T.text }}>WATER TARGET</span>
                                    <span style={{ fontSize: '0.7rem', color: '#3182ce', fontWeight: 700 }}>{results.macros.water} Liters</span>
                                </div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <SparklesIcon style={{ width: 18, color: T.acc, marginTop: 2 }} />
                            <div style={{ fontSize: '0.65rem', color: T.text, lineHeight: 1.5 }}>
                                <strong>Antigravity Pro-Tip:</strong> Consistent intake is more important than perfection. Tracker your progress for 2 weeks before adjusting these targets.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalorieCalculator;
