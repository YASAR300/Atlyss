import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HomeIcon, UsersIcon, AcademicCapIcon,
    ClipboardDocumentListIcon, CalendarIcon,
    ArrowLeftOnRectangleIcon, ChartBarIcon,
    Bars3Icon, XMarkIcon, UserCircleIcon, Cog6ToothIcon, FingerPrintIcon
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
        { name: 'Attendance', path: '/attendance', icon: FingerPrintIcon },
        { name: 'Classes', path: '/classes', icon: CalendarIcon },
        { name: 'Exercises', path: '/workouts', icon: ClipboardDocumentListIcon },
    ],
    member: [
        { name: 'Dashboard', path: '/dashboard/member', icon: HomeIcon },
        { name: 'Attendance', path: '/attendance', icon: FingerPrintIcon },
        { name: 'Workouts', path: '/workouts', icon: ClipboardDocumentListIcon },
        { name: 'Classes', path: '/classes', icon: CalendarIcon },
        { name: 'Progress', path: '/progress', icon: ChartBarIcon },
    ],
};

const roleColors = {
    admin: { accent: '#f1642a', bg: 'rgba(241,100,42,0.08)', border: 'rgba(241,100,42,0.22)', label: 'ADMIN' },
    trainer: { accent: '#4a7ec7', bg: 'rgba(74,126,199,0.08)', border: 'rgba(74,126,199,0.22)', label: 'TRAINER' },
    member: { accent: '#4a9e6b', bg: 'rgba(74,158,107,0.08)', border: 'rgba(74,158,107,0.22)', label: 'MEMBER' },
};

export default function Topbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef(null);

    const links = user ? (roleLinks[user.role] || []) : [];
    const role = roleColors[user?.role] || roleColors.member;

    const profilePath = user?.role === 'admin' ? '/admin/profile'
        : user?.role === 'trainer' ? '/trainer/profile'
            : '/member/profile';

    useEffect(() => {
        const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

                /* ─── Topbar shell ─── */
                .topbar {
                    position: fixed; top: 0; left: 0; right: 0;
                    height: 54px;
                    display: flex; align-items: center;
                    padding: 0 18px;
                    z-index: 100;
                    background: rgba(8,8,8,0.85);
                    border-bottom: 1px solid #1a1a1a;
                    backdrop-filter: blur(16px) saturate(160%);
                    -webkit-backdrop-filter: blur(16px) saturate(160%);
                    transition: box-shadow 0.25s, border-color 0.25s;
                }
                .topbar.scrolled {
                    box-shadow: 0 4px 40px rgba(0,0,0,0.6);
                    border-color: #212121;
                }

                /* ─── Logo area ─── */
                .topbar-logo {
                    display: flex; align-items: center; gap: 10px;
                    text-decoration: none; flex-shrink: 0; margin-right: 20px;
                }
                .topbar-logo img {
                    height: 30px; width: auto; object-fit: contain; display: block;
                }
                .logo-pulse {
                    width: 5px; height: 5px; border-radius: 50%;
                    background: ${role.accent};
                    flex-shrink: 0;
                    animation: pulseAnim 2.2s ease infinite;
                    box-shadow: 0 0 6px ${role.accent};
                }
                @keyframes pulseAnim {
                    0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.75)}
                }

                /* ─── Separator ─── */
                .topbar-sep {
                    width: 1px; height: 18px;
                    background: linear-gradient(to bottom, transparent, #2a2a2a, transparent);
                    margin-right: 16px; flex-shrink: 0;
                }

                /* ─── Nav links ─── */
                .topbar-nav {
                    display: flex; align-items: center; gap: 1px;
                    flex: 1; overflow: hidden;
                }
                .tnav-link {
                    display: flex; align-items: center; gap: 6px;
                    padding: 6px 11px;
                    border-radius: 3px;
                    font-family: 'Space Mono', monospace;
                    font-size: 0.67rem; font-weight: 700;
                    letter-spacing: 0.1em; text-transform: uppercase;
                    color: #4a4a4a;
                    text-decoration: none;
                    transition: color 0.15s, background 0.15s, border-color 0.15s;
                    border: 1px solid transparent;
                    cursor: pointer;
                    white-space: nowrap;
                    position: relative;
                }
                .tnav-link:hover {
                    color: #c0c0c0;
                    background: rgba(255,255,255,0.04);
                    border-color: #1e1e1e;
                }
                .tnav-link.active {
                    color: ${role.accent};
                    background: ${role.bg};
                    border-color: ${role.border};
                }
                .tnav-link.active::after {
                    content: '';
                    position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%);
                    width: 16px; height: 1px;
                    background: ${role.accent};
                    opacity: 0.6;
                    border-radius: 1px;
                }
                .tnav-link svg { flex-shrink: 0; }

                /* ─── Right cluster ─── */
                .topbar-right {
                    display: flex; align-items: center; gap: 8px;
                    margin-left: auto; flex-shrink: 0;
                }

                /* ─── Role badge ─── */
                .role-badge {
                    font-family: 'Space Mono', monospace;
                    font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
                    padding: 2px 8px;
                    border: 1px solid ${role.border};
                    color: ${role.accent};
                    background: ${role.bg};
                    border-radius: 2px;
                }

                /* ─── User button ─── */
                .user-btn {
                    display: flex; align-items: center; gap: 8px;
                    padding: 4px 10px 4px 5px;
                    background: transparent;
                    border: 1px solid #1e1e1e;
                    border-radius: 3px;
                    cursor: pointer;
                    transition: all 0.14s;
                    position: relative;
                }
                .user-btn:hover, .user-btn.open {
                    background: #111;
                    border-color: #2a2a2a;
                }
                .user-avatar {
                    width: 26px; height: 26px; border-radius: 3px;
                    background: ${role.bg};
                    border: 1px solid ${role.border};
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'Space Mono', monospace; font-size: 0.65rem; font-weight: 700;
                    color: ${role.accent}; flex-shrink: 0;
                    letter-spacing: 0.02em;
                }
                .user-name {
                    font-family: 'Space Mono', monospace;
                    font-size: 0.7rem; color: #5a5a5a;
                    max-width: 88px; overflow: hidden;
                    text-overflow: ellipsis; white-space: nowrap;
                }
                .chevron {
                    transition: transform 0.18s;
                    flex-shrink: 0;
                    color: #2e2e2e;
                }
                .chevron.open { transform: rotate(180deg); color: #444; }

                /* ─── Dropdown menu ─── */
                .umenu-wrap {
                    position: absolute; top: calc(100% + 10px); right: 0;
                    min-width: 210px;
                    background: #0c0c0c;
                    border: 1px solid #1e1e1e;
                    border-radius: 5px;
                    box-shadow: 0 12px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03);
                    animation: menuDrop 0.16s cubic-bezier(0.16,1,0.3,1);
                    overflow: hidden;
                    z-index: 200;
                }
                @keyframes menuDrop {
                    from{opacity:0;transform:translateY(-6px) scale(0.98)}
                    to{opacity:1;transform:none}
                }
                .umenu-head {
                    padding: 12px 14px 11px;
                    border-bottom: 1px solid #181818;
                    background: rgba(255,255,255,0.015);
                }
                .umenu-name {
                    font-family: 'Space Mono', monospace;
                    font-size: 0.72rem; font-weight: 700; color: #d8d8d8;
                }
                .umenu-email {
                    font-family: 'Space Mono', monospace;
                    font-size: 0.58rem; color: #333; margin-top: 3px;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .umenu-body { padding: 6px; }
                .umenu-btn {
                    display: flex; align-items: center; gap: 9px;
                    padding: 8px 10px; border-radius: 3px;
                    font-family: 'Space Mono', monospace; font-size: 0.68rem;
                    letter-spacing: 0.05em;
                    color: #4a4a4a;
                    cursor: pointer; background: none; border: none;
                    width: 100%; text-align: left;
                    transition: all 0.12s; text-decoration: none;
                }
                .umenu-btn:hover { background: #161616; color: #c0c0c0; }
                .umenu-btn.danger:hover { background: rgba(160,40,40,0.1); color: #c07060; }
                .umenu-divider { height: 1px; background: #181818; margin: 4px 0; }

                /* ─── Mobile hamburger ─── */
                .mob-btn {
                    width: 32px; height: 32px;
                    background: #0f0f0f; border: 1px solid #1e1e1e;
                    border-radius: 3px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: #4a4a4a;
                    transition: all 0.13s;
                }
                .mob-btn:hover { border-color: #2a2a2a; color: #9a9a9a; }

                /* ─── Mobile menu ─── */
                .mobile-menu {
                    position: fixed; top: 54px; left: 0; right: 0;
                    background: rgba(8,8,8,0.96);
                    border-bottom: 1px solid #1a1a1a;
                    backdrop-filter: blur(20px);
                    z-index: 99;
                    padding: 10px 14px 14px;
                    display: flex; flex-direction: column; gap: 3px;
                    animation: mobileSlide 0.18s ease;
                }
                @keyframes mobileSlide {
                    from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none}
                }
                .mob-link {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 12px; border-radius: 3px;
                    font-family: 'Space Mono', monospace; font-size: 0.7rem;
                    letter-spacing: 0.08em; text-transform: uppercase;
                    color: #4a4a4a; text-decoration: none;
                    border: 1px solid transparent;
                    transition: all 0.13s;
                }
                .mob-link:hover { color: #c0c0c0; background: rgba(255,255,255,0.04); border-color: #1e1e1e; }
                .mob-link.active {
                    color: ${role.accent};
                    background: ${role.bg};
                    border-color: ${role.border};
                }
                .mob-user-row {
                    display: flex; align-items: center; gap: 10px;
                    padding: 10px 12px; margin-top: 6px;
                    border-top: 1px solid #181818;
                }
                .mob-logout {
                    display: flex; align-items: center; gap: 9px;
                    padding: 10px 12px; border-radius: 3px;
                    font-family: 'Space Mono', monospace; font-size: 0.68rem;
                    letter-spacing: 0.06em;
                    color: #4a4a4a;
                    cursor: pointer; background: none; border: 1px solid transparent;
                    width: 100%; text-align: left;
                    transition: all 0.13s;
                }
                .mob-logout:hover { background: rgba(160,40,40,0.08); color: #c07060; border-color: rgba(160,40,40,0.2); }

                /* ─── Responsive visibility ─── */
                @media (min-width: 769px) {
                    .topbar-nav, .topbar-sep, .role-badge { display: flex !important; }
                    .user-name { display: block !important; }
                    .mob-btn { display: none !important; }
                }
                @media (max-width: 768px) {
                    .topbar-nav, .topbar-sep, .role-badge, .user-name { display: none !important; }
                    .mob-btn { display: flex !important; }
                }
            `}</style>

            {/* ─── Main Navbar ─── */}
            <header className={`topbar${scrolled ? ' scrolled' : ''}`}>

                {/* Logo */}
                <Link to="/" className="topbar-logo">
                    <img src={logo} alt="Atlyss" />
                    <div className="logo-pulse" />
                </Link>

                {/* Separator */}
                <div className="topbar-sep" />

                {/* Nav links */}
                <nav className="topbar-nav">
                    {links.map(link => {
                        const active = location.pathname === link.path ||
                            (link.path !== '/' && location.pathname.startsWith(link.path));
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`tnav-link${active ? ' active' : ''}`}
                            >
                                <link.icon style={{ width: 11, height: 11 }} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right cluster */}
                <div className="topbar-right">

                    {/* Role badge */}
                    {user && (
                        <span className="role-badge">{role.label}</span>
                    )}

                    {/* User dropdown */}
                    {user && (
                        <div ref={menuRef} style={{ position: 'relative' }}>
                            <button
                                className={`user-btn${userMenuOpen ? ' open' : ''}`}
                                onClick={() => setUserMenuOpen(v => !v)}
                                aria-expanded={userMenuOpen}
                            >
                                <div className="user-avatar">{initials}</div>
                                <span className="user-name">{user.name?.split(' ')[0]}</span>
                                <svg
                                    className={`chevron${userMenuOpen ? ' open' : ''}`}
                                    width="9" height="9" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2.5"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {userMenuOpen && (
                                <div className="umenu-wrap">
                                    <div className="umenu-head">
                                        <div className="umenu-name">{user.name}</div>
                                        <div className="umenu-email">{user.email}</div>
                                    </div>
                                    <div className="umenu-body">
                                        <Link to={profilePath} className="umenu-btn" onClick={() => setUserMenuOpen(false)}>
                                            <UserCircleIcon style={{ width: 13, height: 13 }} />
                                            Profile
                                        </Link>
                                        <Link to="/settings" className="umenu-btn" onClick={() => setUserMenuOpen(false)}>
                                            <Cog6ToothIcon style={{ width: 13, height: 13 }} />
                                            Settings
                                        </Link>
                                        <div className="umenu-divider" />
                                        <button onClick={logout} className="umenu-btn danger">
                                            <ArrowLeftOnRectangleIcon style={{ width: 13, height: 13 }} />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="mob-btn"
                        onClick={() => setMobileOpen(v => !v)}
                        aria-label="Toggle navigation"
                    >
                        {mobileOpen
                            ? <XMarkIcon style={{ width: 15 }} />
                            : <Bars3Icon style={{ width: 15 }} />
                        }
                    </button>
                </div>
            </header>

            {/* ─── Mobile Menu ─── */}
            {mobileOpen && (
                <div className="mobile-menu">
                    {links.map(link => {
                        const active = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`mob-link${active ? ' active' : ''}`}
                            >
                                <link.icon style={{ width: 14, height: 14 }} />
                                {link.name}
                            </Link>
                        );
                    })}
                    {user && (
                        <>
                            <div className="mob-user-row">
                                <div className="user-avatar" style={{
                                    width: 28, height: 28, borderRadius: 3,
                                    background: role.bg, border: `1px solid ${role.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: "'Space Mono', monospace", fontSize: '0.65rem',
                                    fontWeight: 700, color: role.accent,
                                }}>{initials}</div>
                                <div>
                                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: '#c0c0c0' }}>{user.name}</div>
                                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.56rem', color: '#333', marginTop: 1 }}>{user.email}</div>
                                </div>
                            </div>
                            <button onClick={logout} className="mob-logout">
                                <ArrowLeftOnRectangleIcon style={{ width: 14 }} />
                                Logout
                            </button>
                        </>
                    )}
                </div>
            )}
        </>
    );
}