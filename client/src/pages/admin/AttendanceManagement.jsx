import React, { useState, useEffect } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
    FunnelIcon,
    ArrowPathIcon,
    PencilSquareIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChartBarIcon,
    CheckCircleIcon,
    XCircleIcon,
    CalendarDaysIcon,
    ListBulletIcon
} from '@heroicons/react/24/outline';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';

const T = {
    bg: '#080808', card: '#111',
    border: '#222', borderMid: '#333',
    hi: '#fff', text: '#aaa', muted: '#555',
    acc: '#f1642a',
    green: '#4da870',
    red: '#ef4444',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

const AttendanceManagement = () => {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        method: '',
        role: ''
    });
    const [page, setPage] = useState(1);
    const [editingRecord, setEditingRecord] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

    useEffect(() => {
        fetchData();
    }, [filters, page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [historyRes, statsRes] = await Promise.all([
                api.get('/attendance/history', { params: { ...filters, page } }),
                api.get('/admin/attendance/stats')
            ]);
            setRecords(historyRes.data.records || []);
            setStats(statsRes.data);
        } catch (err) {
            toast.error('Failed to fetch attendance data');
        } finally {
            setLoading(false);
        }
    };

    const handleOverride = async (id, status) => {
        try {
            await api.put(`/admin/attendance/${id}`, { status });
            toast.success('Attendance updated');
            fetchData();
            setEditingRecord(null);
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const getMethodColor = (method) => {
        if (method.startsWith('SENSOR')) return '#4a7ec7';
        if (method === 'MANUAL_TRAINER') return '#d09830';
        return '#888';
    };

    return (
        <DashboardShell title="Attendance">
            <div style={{ paddingBottom: 40 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
                    <div>
                        <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: T.acc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>// Management</div>
                        <h1 style={{ fontFamily: T.disp, fontSize: '2.5rem', color: T.hi, letterSpacing: '0.04em', lineHeight: 1 }}>Attendance Logs</h1>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 8, padding: 3 }}>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    background: viewMode === 'list' ? T.borderMid : 'transparent',
                                    border: 'none', color: viewMode === 'list' ? T.hi : T.muted,
                                    padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 700,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ListBulletIcon style={{ width: 14 }} /> LIST
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                style={{
                                    background: viewMode === 'calendar' ? T.borderMid : 'transparent',
                                    border: 'none', color: viewMode === 'calendar' ? T.hi : T.muted,
                                    padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 700,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <CalendarDaysIcon style={{ width: 14 }} /> CALENDAR
                            </button>
                        </div>
                        <button onClick={fetchData} style={{ background: 'transparent', border: `1px solid ${T.border}`, padding: '10px', borderRadius: 8, color: T.muted, cursor: 'pointer' }}>
                            <ArrowPathIcon style={{ width: 20 }} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginBottom: 30 }}>
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                            <div style={{ fontSize: '0.6rem', color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today Present</div>
                            <div style={{ fontSize: '2rem', fontFamily: T.disp, color: T.green, marginTop: 4 }}>{stats.totalToday}</div>
                        </div>
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                            <div style={{ fontSize: '0.6rem', color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today Absentees</div>
                            <div style={{ fontSize: '2rem', fontFamily: T.disp, color: T.red, marginTop: 4 }}>{stats.absentees}</div>
                        </div>
                        {stats.byMethod.slice(0, 2).map(m => (
                            <div key={m.method} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                                <div style={{ fontSize: '0.6rem', color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.method.replace('_', ' ')}</div>
                                <div style={{ fontSize: '2rem', fontFamily: T.disp, color: T.hi, marginTop: 4 }}>{m._count}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.6rem', color: T.muted, marginBottom: 6, fontWeight: 700 }}>DATE</label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={e => setFilters({ ...filters, date: e.target.value })}
                            style={{ background: '#000', border: `1px solid ${T.borderMid}`, color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', outline: 'none' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.6rem', color: T.muted, marginBottom: 6, fontWeight: 700 }}>METHOD</label>
                        <select
                            value={filters.method}
                            onChange={e => setFilters({ ...filters, method: e.target.value })}
                            style={{ background: '#000', border: `1px solid ${T.borderMid}`, color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', outline: 'none', minWidth: 140 }}
                        >
                            <option value="">All Methods</option>
                            <option value="SENSOR_FACE">Face recognition</option>
                            <option value="SENSOR_QR">QR Code</option>
                            <option value="SENSOR_RFID">RFID / Card</option>
                            <option value="MANUAL_TRAINER">Trainer Entry</option>
                            <option value="MANUAL_ADMIN">Admin Override</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.6rem', color: T.muted, marginBottom: 6, fontWeight: 700 }}>ROLE</label>
                        <select
                            value={filters.role}
                            onChange={e => setFilters({ ...filters, role: e.target.value })}
                            style={{ background: '#000', border: `1px solid ${T.borderMid}`, color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', outline: 'none', minWidth: 120 }}
                        >
                            <option value="">All Roles</option>
                            <option value="member">Members</option>
                            <option value="trainer">Trainers</option>
                        </select>
                    </div>
                </div>

                {/* View Content */}
                {viewMode === 'calendar' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                            <AttendanceCalendar roleFilter={filters.role} />
                        </div>
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                            <h3 style={{ fontFamily: T.disp, fontSize: '1.2rem', color: T.hi, marginBottom: 15 }}>Usage Stats</h3>
                            <div style={{ fontSize: '0.75rem', color: T.text, lineHeight: 1.6 }}>
                                Select a day on the calendar to see specific logs for gym-wide attendance. Use the filters above to narrow down by Role (Member/Trainer).
                            </div>
                            {stats && (
                                <div style={{ marginTop: 25, display: 'flex', flexDirection: 'column', gap: 15 }}>
                                    {stats.byMethod.map(m => (
                                        <div key={m.method} style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: `1px solid ${T.border}` }}>
                                            <div style={{ fontSize: '0.55rem', color: T.muted, fontWeight: 700, textTransform: 'uppercase' }}>{m.method.replace('_', ' ')}</div>
                                            <div style={{ fontSize: '1.4rem', fontFamily: T.disp, color: T.acc }}>{m._count}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '15px 20px', fontSize: '0.65rem', color: T.muted, fontWeight: 700 }}>NAME</th>
                                    <th style={{ padding: '15px 20px', fontSize: '0.65rem', color: T.muted, fontWeight: 700 }}>TIME</th>
                                    <th style={{ padding: '15px 20px', fontSize: '0.65rem', color: T.muted, fontWeight: 700 }}>METHOD</th>
                                    <th style={{ padding: '15px 20px', fontSize: '0.65rem', color: T.muted, fontWeight: 700 }}>STATUS</th>
                                    <th style={{ padding: '15px 20px', fontSize: '0.65rem', color: T.muted, fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: 60, textAlign: 'center', color: T.muted, fontFamily: T.mono, fontSize: '0.8rem' }}>No records found for selected filters</td>
                                    </tr>
                                ) : records.map(r => (
                                    <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ color: T.hi, fontWeight: 600, fontSize: '0.9rem' }}>{r.user.name}</div>
                                            <div style={{ color: T.muted, fontSize: '0.7rem', textTransform: 'uppercase', marginTop: 2 }}>{r.user.role}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ fontSize: '0.85rem', color: T.text }}>{new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div style={{ fontSize: '0.65rem', color: T.muted, marginTop: 2 }}>{new Date(r.checkInTime).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '4px 10px', borderRadius: 4, background: `${getMethodColor(r.method)}22`, color: getMethodColor(r.method), border: `1px solid ${getMethodColor(r.method)}44`, textTransform: 'uppercase' }}>
                                                {r.method.replace('SENSOR_', '').replace('MANUAL_', '')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: r.status === 'PRESENT' ? T.green : T.red, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {r.status === 'PRESENT' ? <CheckCircleIcon style={{ width: 14 }} /> : <XCircleIcon style={{ width: 14 }} />}
                                                {r.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => setEditingRecord(r)}
                                                style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', padding: 5 }}
                                            >
                                                <PencilSquareIcon style={{ width: 18 }} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Edit Modal */}
                {editingRecord && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 30, borderRadius: 16, width: '100%', maxWidth: 400 }}>
                            <h3 style={{ fontFamily: T.disp, fontSize: '1.8rem', color: T.hi, marginBottom: 10 }}>Override Attendance</h3>
                            <p style={{ fontSize: '0.75rem', color: T.text, marginBottom: 25 }}>Update records for <b>{editingRecord.user.name}</b></p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 25 }}>
                                <button
                                    onClick={() => handleOverride(editingRecord.id, 'PRESENT')}
                                    style={{ background: T.green + '22', border: `1px solid ${T.green}44`, color: T.green, padding: 15, borderRadius: 8, cursor: 'pointer', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                                >
                                    <CheckCircleIcon style={{ width: 24 }} />
                                    MARK PRESENT
                                </button>
                                <button
                                    onClick={() => handleOverride(editingRecord.id, 'ABSENT')}
                                    style={{ background: T.red + '22', border: `1px solid ${T.red}44`, color: T.red, padding: 15, borderRadius: 8, cursor: 'pointer', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                                >
                                    <XCircleIcon style={{ width: 24 }} />
                                    MARK ABSENT
                                </button>
                            </div>

                            <button onClick={() => setEditingRecord(null)} style={{ width: '100%', background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: 12, borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem' }}>BACK</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
};

export default AttendanceManagement;
