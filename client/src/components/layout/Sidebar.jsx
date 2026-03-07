import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HomeIcon, UsersIcon, AcademicCapIcon,
    ClipboardDocumentListIcon, CalendarIcon,
    ArrowLeftOnRectangleIcon, ChartBarIcon
} from '@heroicons/react/24/outline';
import logo from '../../assets/logo.png';

const roleLinks = {
    admin: [
        { name: 'Dashboard', path: '/dashboard/admin', icon: HomeIcon },
        { name: 'Members', path: '/members', icon: UsersIcon },
        { name: 'Classes', path: '/classes', icon: CalendarIcon },
        { name: 'Trainers', path: '/trainers', icon: AcademicCapIcon },
    ],
    trainer: [
        { name: 'Dashboard', path: '/dashboard/trainer', icon: HomeIcon },
        { name: 'Members', path: '/members', icon: UsersIcon },
        { name: 'Classes', path: '/classes', icon: CalendarIcon },
        { name: 'Review Plans', path: '/manage-workouts', icon: ClipboardDocumentListIcon },
    ],
    member: [
        { name: 'Dashboard', path: '/dashboard/member', icon: HomeIcon },
        { name: 'Workouts', path: '/workouts', icon: ClipboardDocumentListIcon },
        { name: 'Classes', path: '/classes', icon: CalendarIcon },
        { name: 'Progress', path: '/progress', icon: ChartBarIcon },
    ],
};

const roleBadge = {
    admin: { text: 'Admin', cls: 'badge-red' },
    trainer: { text: 'Trainer', cls: 'badge-orange' },
    member: { text: 'Member', cls: 'badge-blue' },
};

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    if (!user) return null;

    const links = roleLinks[user.role] || [];
    const rb = roleBadge[user.role];

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                    <div style={{
                        width: 42, height: 42,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,100,0,0.2)',
                        borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        boxShadow: '0 0 20px rgba(255,80,0,0.12)',
                    }}>
                        <img src={logo} alt="Atlyss" style={{ width: '75%', height: '75%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', letterSpacing: '0.06em', color: '#fff', lineHeight: 1 }}>
                            Atlyss
                        </div>
                        <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>
                            Gym Management
                        </div>
                    </div>
                </Link>
            </div>

            {/* Role badge */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className={`badge ${rb?.cls}`}>{rb?.text}</span>
            </div>

            {/* nav */}
            <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {links.map(link => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link key={link.path} to={link.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                            <link.icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                            {link.name}
                            {isActive && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#ff5020' }} />}
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', marginBottom: 8 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', color: '#ff6030',
                        flexShrink: 0,
                    }}>{user.name?.[0]?.toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    </div>
                </div>
                <button onClick={logout} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowLeftOnRectangleIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
