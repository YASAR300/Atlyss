import React from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import CalorieCalculator from '../../components/features/CalorieCalculator';

const CalorieCalculatorPage = () => {
    return (
        <DashboardShell title="Calorie Calculator">
            <div className="fade-up visible">
                <div style={{ marginBottom: 20 }}>
                    <h1 className="page-title">Calorie Calculator</h1>
                    <p className="page-subtitle">Estimate your daily energy needs and nutrition targets.</p>
                </div>

                <CalorieCalculator />

                <div style={{ marginTop: 24, padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                    <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem', marginBottom: 12 }}>How it works</h3>
                    <p style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.6 }}>
                        This calculator uses the <strong>Mifflin-St Jeor Equation</strong> to estimate your Basal Metabolic Rate (BMR).
                        Your Total Daily Energy Expenditure (TDEE) is then calculated by applying an activity multiplier to your BMR.
                        Depending on your fitness goal, we adjust these calories to help you lose weight, gain muscle, or maintain your current physique.
                    </p>
                </div>
            </div>
        </DashboardShell>
    );
};

export default CalorieCalculatorPage;
