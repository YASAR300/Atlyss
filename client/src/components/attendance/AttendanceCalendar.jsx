import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../../utils/api';
import {
    CheckCircleIcon,
    XMarkIcon,
    ClockIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const T = {
    bg: '#080808', card: '#111',
    border: '#222', borderMid: '#333',
    hi: '#fff', text: '#aaa', muted: '#555',
    acc: '#f1642a',
    green: '#4da870',
    red: '#ef4444',
    amber: '#d09830',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

const AttendanceCalendar = ({ userId, classId, roleFilter }) => {
    const [date, setDate] = useState(new Date());
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDayRecord, setSelectedDayRecord] = useState(null);

    useEffect(() => {
        fetchMonthData(date);
    }, [date, userId, classId, roleFilter]);

    const fetchMonthData = async (currentDate) => {
        setLoading(true);
        try {
            // Get first and last day of the visible month range
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const params = {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                userId,
                classId,
                role: roleFilter
            };

            const res = await api.get('/attendance/history', { params });
            setAttendance(res.data.records || []);
        } catch (err) {
            console.error('Failed to fetch calendar data', err);
        } finally {
            setLoading(false);
        }
    };

    const getDayStatus = (day) => {
        const d = new Date(day);
        d.setHours(0, 0, 0, 0);

        const record = attendance.find(r => {
            const rd = new Date(r.checkInTime);
            rd.setHours(0, 0, 0, 0);
            return rd.getTime() === d.getTime();
        });

        return record;
    };

    const tileClassName = ({ date, view }) => {
        if (view !== 'month') return null;
        const record = getDayStatus(date);
        if (!record) return null;
        return record.status === 'PRESENT' ? 'status-present' : 'status-absent';
    };

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        const record = getDayStatus(date);
        if (!record) return null;

        return (
            <div className="dot-container">
                <div className={`status-dot ${record.status.toLowerCase()}`} />
            </div>
        );
    };

    return (
        <div className="mech-calendar-wrapper">
            <style>{`
                .mech-calendar-wrapper {
                    background: #0a0a0a;
                    border: 1px solid #1a1a1a;
                    padding: 2px;
                    position: relative;
                }
                .mech-calendar-wrapper::before {
                    content: ''; position: absolute; top: -1px; left: -1px; width: 20px; height: 20px;
                    border-top: 2px solid ${T.acc}; border-left: 2px solid ${T.acc};
                }
                .mech-calendar-wrapper::after {
                    content: 'ATTENDANCE_V2.0'; position: absolute; top: -15px; right: 10px;
                    font-family: ${T.mono}; font-size: 0.5rem; color: ${T.acc}; letter-spacing: 0.2em;
                }
                
                .inner-content {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    padding: 24px;
                }

                .react-calendar {
                    width: 100% !important;
                    background: transparent !important;
                    border: none !important;
                    font-family: ${T.mono} !important;
                    color: ${T.text} !important;
                }
                
                .react-calendar__navigation {
                    margin-bottom: 20px !important;
                    border-bottom: 1px dashed #222;
                    padding-bottom: 10px;
                }
                .react-calendar__navigation button {
                    color: ${T.hi} !important;
                    font-family: ${T.disp} !important;
                    font-size: 1.4rem !important;
                    letter-spacing: 0.05em !important;
                    min-width: 44px;
                    background: none;
                }
                .react-calendar__navigation button:enabled:hover {
                    background: ${T.accDim} !important;
                    color: ${T.acc} !important;
                }
                
                .react-calendar__month-view__weekdays {
                    font-family: ${T.mono} !important;
                    font-size: 0.6rem !important;
                    text-transform: uppercase !important;
                    color: #444 !important;
                    font-weight: 700 !important;
                    margin-bottom: 15px;
                }
                .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none !important;
                }
                
                .react-calendar__tile {
                    padding: 16px 8px !important;
                    position: relative;
                    border: 1px solid transparent !important;
                    transition: all 0.15s ease;
                    color: #555 !important;
                    background: none;
                }
                .react-calendar__tile:enabled:hover {
                    background: #111 !important;
                    border-color: #222 !important;
                    color: ${T.hi} !important;
                }
                .react-calendar__tile--now {
                    color: ${T.acc} !important;
                    background: ${T.accDim} !important;
                    font-weight: 700;
                }
                .react-calendar__tile--active {
                    background: ${T.acc} !important;
                    color: #000 !important;
                    font-weight: 700;
                }
                .react-calendar__tile--active:enabled:hover {
                    background: ${T.acc} !important;
                }
                
                .dot-container {
                    display: flex;
                    justify-content: center;
                    margin-top: 6px;
                }
                .status-dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 1px;
                }
                .status-dot.present { background: ${T.green}; box-shadow: 0 0 10px ${T.green}aa; }
                .status-dot.absent { background: ${T.red}; box-shadow: 0 0 10px ${T.red}aa; }
                
                .hazard-stripes {
                    height: 4px;
                    background: repeating-linear-gradient(
                        -45deg,
                        #1a1a1a,
                        #1a1a1a 5px,
                        #111 5px,
                        #111 10px
                    );
                    margin-top: 20px;
                    border: 1px solid #1a1a1a;
                }

                .details-panel {
                    margin-top: 25px;
                    background: #0a0a0a;
                    border: 1px solid #1a1a1a;
                    padding: 20px;
                    position: relative;
                    animation: slideUp 0.3s ease;
                }
                .details-panel::after {
                    content: '// SYSTEM_READOUT';
                    position: absolute; top: -8px; left: 15px;
                    font-family: ${T.mono}; font-size: 0.5rem; color: #444; background: #0a0a0a; padding: 0 8px;
                }
                
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="inner-content">
                <Calendar
                    onChange={setDate}
                    value={date}
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                    onClickDay={(value) => setSelectedDayRecord(getDayStatus(value) || { date: value, status: 'NONE' })}
                />

                <div className="hazard-stripes" />

                {selectedDayRecord && (
                    <div className="details-panel">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{'>> SELECTED_TIMESTAMP'}</div>
                                <div style={{ fontFamily: T.disp, fontSize: '1.6rem', color: T.hi, letterSpacing: '0.04em' }}>
                                    {new Date(selectedDayRecord.date || selectedDayRecord.checkInTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
                                </div>
                            </div>
                            {selectedDayRecord.status !== 'NONE' ? (
                                <div style={{
                                    padding: '6px 14px', border: `1px solid ${selectedDayRecord.status === 'PRESENT' ? T.green : T.red}44`,
                                    background: `${selectedDayRecord.status === 'PRESENT' ? T.green : T.red}11`,
                                }}>
                                    <span style={{ fontFamily: T.mono, fontSize: '0.75rem', fontWeight: 700, color: selectedDayRecord.status === 'PRESENT' ? T.green : T.red }}>
                                        {selectedDayRecord.status === 'PRESENT' ? 'CONFIRMED' : 'MISSING'}
                                    </span>
                                </div>
                            ) : (
                                <div style={{ fontFamily: T.mono, fontSize: '0.65rem', color: '#333', border: '1px solid #1a1a1a', padding: '4px 10px' }}>LOG_NULL</div>
                            )}
                        </div>

                        {selectedDayRecord.status !== 'NONE' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div style={{ background: '#080808', padding: '14px', borderLeft: `2px solid ${T.acc}` }}>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: '#444', marginBottom: 6 }}>{'// CLOCK_IN'}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <ClockIcon style={{ width: 14, color: T.acc }} />
                                        <span style={{ fontFamily: T.mono, fontSize: '0.9rem', color: T.hi, fontWeight: 700 }}>
                                            {new Date(selectedDayRecord.checkInTime).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ background: '#080808', padding: '14px', borderLeft: `2px solid ${T.amber}` }}>
                                    <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: '#444', marginBottom: 6 }}>{'// AUTH_METHOD'}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <InformationCircleIcon style={{ width: 14, color: T.amber }} />
                                        <span style={{ fontFamily: T.mono, fontSize: '0.8rem', color: T.text, fontWeight: 600 }}>
                                            {selectedDayRecord.method?.replace('SENSOR_', '').replace('MANUAL_', '')}
                                        </span>
                                    </div>
                                </div>
                                {selectedDayRecord.class && (
                                    <div style={{ gridColumn: 'span 2', background: '#080808', padding: '14px', borderLeft: `2px solid ${T.blue}` }}>
                                        <div style={{ fontFamily: T.mono, fontSize: '0.55rem', color: '#444', marginBottom: 6 }}>{'// MODULE_CONTEXT'}</div>
                                        <div style={{ fontFamily: T.mono, fontSize: '0.9rem', fontWeight: 700, color: T.hi }}>{selectedDayRecord.class.className.toUpperCase()}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <div style={{ fontFamily: T.mono, fontSize: '0.8rem', color: T.acc, letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 16, height: 16, border: '2px solid transparent', borderTopColor: T.acc, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        DECRYPTING_DATA...
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceCalendar;
