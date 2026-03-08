import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
    QrCodeIcon,
    UserIcon,
    IdentificationIcon,
    VideoCameraIcon,
    CheckCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const T = {
    bg: '#080808', card: '#111',
    border: '#222',
    hi: '#fff', text: '#aaa', muted: '#444',
    acc: '#f1642a',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

const AttendanceKiosk = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [users, setUsers] = useState({ members: [], trainers: [] });
    const [selectedUserId, setSelectedUserId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [lastCheckin, setLastCheckin] = useState(null);
    const [mode, setMode] = useState('idle'); // idle, scanning, success

    useEffect(() => {
        fetchUsers();
        return () => stopCamera();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/kiosk-users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users for simulation', err);
        }
    };

    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            videoRef.current.srcObject = s;
            setStream(s);
            setMode('scanning');
        } catch (err) {
            toast.error('Camera access denied or unavailable');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setMode('idle');
    };

    const handleSimulate = async (method) => {
        if (!selectedUserId) return toast.error('Please select a member to simulate');

        setProcessing(true);
        try {
            const res = await api.post('/attendance/check-in', {
                userId: selectedUserId,
                method: method
            });

            setLastCheckin({
                name: res.data.attendance.user.name,
                time: new Date().toLocaleTimeString(),
                method: method.split('_')[1]
            });

            setMode('success');
            toast.success(`Check-in Successful: ${res.data.attendance.user.name}`);

            setTimeout(() => {
                setMode('idle');
                if (stream) setMode('scanning');
            }, 3000);

        } catch (err) {
            toast.error(err.response?.data?.message || 'Check-in failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.hi, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: T.mono }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{ color: T.acc, fontSize: '0.7rem', letterSpacing: '0.3em', marginBottom: 8 }}>// ATLYSS BIOMETRIC KIOSK</div>
                <h1 style={{ fontFamily: T.disp, fontSize: '3.5rem', letterSpacing: '0.05em', lineHeight: 1 }}>FRONT DESK KIOSK</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 500px) 320px', gap: 30, maxWidth: 900, width: '100%' }}>

                {/* Left: Camera / Scanner Simulation */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 380 }}>

                    {mode === 'idle' && (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <VideoCameraIcon style={{ width: 40, color: T.muted }} />
                            </div>
                            <button onClick={startCamera} style={{ background: T.acc, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>START SCANNER</button>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: mode === 'scanning' || mode === 'success' ? 'block' : 'none',
                            filter: mode === 'success' ? 'grayscale(100%) blur(4px)' : 'none',
                            opacity: mode === 'success' ? 0.3 : 1,
                            transition: 'all 0.5s'
                        }}
                    />

                    {mode === 'scanning' && (
                        <div style={{ position: 'absolute', inset: 0, border: `2px dashed ${T.acc}`, margin: 40, pointerEvents: 'none', animation: 'scannerPulse 2s infinite' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: T.acc, boxShadow: `0 0 15px ${T.acc}`, animation: 'scannerMove 2s infinite linear' }} />
                        </div>
                    )}

                    {mode === 'success' && lastCheckin && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', animation: 'fadeIn 0.3s' }}>
                            <CheckCircleIcon style={{ width: 80, color: '#4da870', marginBottom: 15 }} />
                            <div style={{ fontFamily: T.disp, fontSize: '2.5rem', color: '#fff' }}>WELCOME, {lastCheckin.name.split(' ')[0].toUpperCase()}</div>
                            <div style={{ color: T.text, fontSize: '0.8rem', marginTop: 5 }}>CHECK-IN RECORDED AT {lastCheckin.time}</div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 20, fontSize: '0.6rem', marginTop: 15, border: '1px solid rgba(255,255,255,0.1)' }}>METHOD: {lastCheckin.method}</div>
                        </div>
                    )}

                    <style>{`
                        @keyframes scannerMove { 0% { top: 0; } 100% { top: 100%; } }
                        @keyframes scannerPulse { 0% { opacity: 0.3; } 50% { opacity: 0.8; } 100% { opacity: 0.3; } }
                        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    `}</style>
                </div>

                {/* Right: Simulation Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                        <div style={{ fontSize: '0.65rem', color: T.muted, marginBottom: 15, letterSpacing: '0.1em' }}>[ SIMULATION CONTROLS ]</div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: '0.6rem', color: T.text, marginBottom: 8, textTransform: 'uppercase' }}>Select Member to Simulate</label>
                            <select
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                                style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#fff', padding: 10, borderRadius: 4, fontSize: '0.75rem', outline: 'none' }}
                            >
                                <option value="">Select User...</option>
                                <optgroup label="Members">
                                    {users.members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.member?.memberNo || m.email})</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Trainers">
                                    {users.trainers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} (TRAINER)</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                            <button
                                disabled={processing || !selectedUserId}
                                onClick={() => handleSimulate('SENSOR_FACE')}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.7rem', textAlign: 'left', transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = T.acc}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
                            >
                                <UserIcon style={{ width: 18, color: T.acc }} />
                                <span>SIMULATE FACE SCAN</span>
                            </button>

                            <button
                                disabled={processing || !selectedUserId}
                                onClick={() => handleSimulate('SENSOR_QR')}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.7rem', textAlign: 'left', transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = T.acc}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
                            >
                                <QrCodeIcon style={{ width: 18, color: T.acc }} />
                                <span>SIMULATE QR SCAN</span>
                            </button>

                            <button
                                disabled={processing || !selectedUserId}
                                onClick={() => handleSimulate('SENSOR_RFID')}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.7rem', textAlign: 'left', transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = T.acc}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
                            >
                                <IdentificationIcon style={{ width: 18, color: T.acc }} />
                                <span>SIMULATE RFID TAP</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 15, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4da870', animation: 'pulse 1.5s infinite' }} />
                        <div style={{ fontSize: '0.6rem', color: T.text, letterSpacing: '0.05em' }}>SYSTEM STATUS: SCANNER ONLINE</div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 60, color: T.muted, fontSize: '0.6rem', display: 'flex', gap: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ClockIcon style={{ width: 12 }} /> AUTHENTICATION LOGS ACTIVE</div>
                <div>SECURED BY ATLYSS BIOMETRICS</div>
            </div>

            <style>{`
                @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            `}</style>
        </div>
    );
};

export default AttendanceKiosk;
