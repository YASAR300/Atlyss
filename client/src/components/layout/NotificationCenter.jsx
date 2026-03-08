import React, { useState, useEffect, useRef } from 'react';
import {
    BellIcon,
    XMarkIcon,
    InformationCircleIcon,
    FireIcon,
    TicketIcon,
    CalendarIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const T = {
    bg: '#080808', card: '#121212',
    border: '#222',
    hi: '#fff', text: '#aaa', muted: '#555',
    acc: '#f1642a',
    mono: "'Space Mono', monospace",
    disp: "'Bebas Neue', sans-serif",
};

const NotificationCenter = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const r = await api.get('/notifications');
            setNotifications(r.data.notifications || []);
            setUnreadCount(r.data.notifications.filter(n => n.status === 'UNREAD').length);
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'EXPIRY': return <TicketIcon style={{ width: 16, color: '#f87171' }} />;
            case 'OFFER': return <FireIcon style={{ width: 16, color: '#fbbf24' }} />;
            case 'CLASS': return <CalendarIcon style={{ width: 16, color: '#60a5fa' }} />;
            case 'WORKOUT': return <ClipboardDocumentListIcon style={{ width: 16, color: T.acc }} />;
            case 'DIET': return <TicketIcon style={{ width: 16, color: '#34d399' }} />;
            default: return <InformationCircleIcon style={{ width: 16, color: T.text }} />;
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none', border: 'none', padding: 8, cursor: 'pointer',
                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <BellIcon style={{ width: 22, color: unreadCount > 0 ? T.acc : T.text }} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 5, right: 5, background: T.acc, color: '#fff',
                        fontSize: '0.6rem', fontWeight: 700, padding: '2px 5px', borderRadius: 10,
                        border: `2px solid ${T.bg}`, fontFamily: T.mono
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 15, width: 340,
                    background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span style={{ fontFamily: T.disp, fontSize: '1.2rem', letterSpacing: '0.05em' }}>NOTIFICATIONS</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                style={{
                                    background: 'none', border: 'none', color: T.acc, fontSize: '0.65rem',
                                    fontFamily: T.mono, cursor: 'pointer', padding: 0
                                }}
                            >
                                MARK ALL READ
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>
                                <BellIcon style={{ width: 32, margin: '0 auto 12px', opacity: 0.2 }} />
                                <div style={{ fontSize: '0.75rem', fontFamily: T.mono }}>No new alerts.</div>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => n.status === 'UNREAD' && markAsRead(n.id)}
                                    style={{
                                        padding: '16px 20px', borderBottom: `1px solid ${T.border}88`,
                                        cursor: 'pointer', transition: '0.2s',
                                        background: n.status === 'UNREAD' ? 'rgba(255,100,0,0.03)' : 'transparent',
                                        display: 'flex', gap: 12
                                    }}
                                >
                                    <div style={{ marginTop: 2 }}>{getTypeIcon(n.type)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: n.status === 'UNREAD' ? T.hi : T.text, marginBottom: 4 }}>
                                            {n.title}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: n.status === 'UNREAD' ? T.text : T.muted, lineHeight: 1.4 }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: T.muted, marginTop: 8, fontFamily: T.mono }}>
                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    {n.status === 'UNREAD' && (
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.acc, marginTop: 22 }} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '12px 20px', background: '#0a0a0a', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.6rem', color: T.muted, fontFamily: T.mono }}>SYSTEM LOG v1.02_ATLYSS</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
