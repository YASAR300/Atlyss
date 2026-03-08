import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

/* ─── Animated Pulse Bars (canvas-based energy visualizer) ─── */
const PulseCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const bars = Array.from({ length: 28 }, (_, i) => ({
      x: i,
      h: 0.2 + Math.random() * 0.6,
      speed: 0.01 + Math.random() * 0.025,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = (t) => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const bw = W / bars.length;
      bars.forEach((b, i) => {
        const amp = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * b.speed * 60 + b.phase));
        const bh = amp * H * 0.72;
        const y = H - bh;
        const alpha = 0.18 + amp * 0.55;

        const grad = ctx.createLinearGradient(0, y, 0, H);
        grad.addColorStop(0, `rgba(255,60,30,${alpha})`);
        grad.addColorStop(0.5, `rgba(255,120,10,${alpha * 0.7})`);
        grad.addColorStop(1, `rgba(255,60,30,0.04)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(i * bw + bw * 0.18, y, bw * 0.64, bh, [3, 3, 0, 0]);
        ctx.fill();
      });

      // Top glow line
      const glowGrad = ctx.createLinearGradient(0, 0, W, 0);
      glowGrad.addColorStop(0, 'transparent');
      glowGrad.addColorStop(0.3, 'rgba(255,80,20,0.4)');
      glowGrad.addColorStop(0.7, 'rgba(255,140,0,0.35)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = glowGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(W, 2);
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />;
};

/* ─── Stat Counter ─── */
const StatTicker = ({ value, label }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const id = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(id); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(id);
  }, [value]);
  return (
    <div className="text-center">
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', lineHeight: 1, color: '#fff', letterSpacing: '0.04em' }}>
        {display.toLocaleString()}+
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '3px' }}>
        {label}
      </div>
    </div>
  );
};

/* ─── Main Login Component ─── */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ── Already logged in? Redirect to dashboard ──
  useEffect(() => {
    if (!authLoading && user) {
      navigate(`/dashboard/${user.role}`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
  }, []);

  // Show nothing while auth is being checked
  if (authLoading) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(`/dashboard/${user.role}`);
    } catch {
      // handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@atlyss.com', password: 'Admin@123' },
      trainer: { email: 'jake@atlyss.com', password: 'Trainer@123' },
      member: { email: 'john@atlyss.com', password: 'Member@123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pg-root {
          min-height: 100vh;
          background: #080808;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        /* ── noise grain overlay ── */
        .pg-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.028;
          pointer-events: none;
          z-index: 100;
        }

        /* ══ LEFT PANEL ══ */
        .pg-left {
          width: 44%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
          clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%);
        }

        @media (max-width: 768px) {
          .pg-left { display: none; }
          .pg-right { width: 100% !important; }
        }

        .pg-left-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, #100800 0%, #0d0300 40%, #000 100%);
        }

        .pg-left-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,70,20,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,70,20,0.06) 1px, transparent 1px);
          background-size: 44px 44px;
        }

        .pg-left-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,0.82) 100%);
        }

        .pg-left-canvas {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 44%;
        }

        .pg-left-content {
          position: relative;
          z-index: 2;
          padding: 0 44px 48px;
        }

        .pg-big-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(4.5rem, 7vw, 6.5rem);
          line-height: 0.9;
          letter-spacing: 0.02em;
          color: #fff;
          text-shadow: 0 0 80px rgba(255,80,0,0.25);
        }

        .pg-big-text span {
          -webkit-text-fill-color: transparent;
          -webkit-text-stroke: 1.5px rgba(255,255,255,0.18);
        }

        .pg-accent-line {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, #ff3d00, #ff8c00);
          margin: 18px 0 20px;
          border-radius: 2px;
        }

        .pg-tagline {
          font-size: 0.78rem;
          font-weight: 300;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          line-height: 1.6;
          max-width: 220px;
        }

        .pg-stats-row {
          display: flex;
          gap: 32px;
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .pg-stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.08);
        }

        /* ══ RIGHT PANEL ══ */
        .pg-right {
          width: 56%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          background: #070707;
          position: relative;
        }

        .pg-right::before {
          content: '';
          position: absolute;
          top: -200px;
          right: -200px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255,50,0,0.055) 0%, transparent 65%);
          pointer-events: none;
        }
        .pg-right::after {
          content: '';
          position: absolute;
          bottom: -150px;
          left: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255,120,0,0.04) 0%, transparent 65%);
          pointer-events: none;
        }

        .pg-form-wrap {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        /* ── Logo ── */
        .pg-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 38px;
        }

        .pg-logo-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,100,0,0.2);
          border-radius: 12px;
          box-shadow: 0 0 20px rgba(255,80,0,0.15);
        }
        .pg-logo-icon img {
          width: 80%;
          height: 80%;
          object-fit: contain;
        }

        .pg-logo-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.65rem;
          letter-spacing: 0.06em;
          color: #fff;
          line-height: 1;
        }

        .pg-logo-name em {
          font-style: normal;
          color: #ff5500;
        }

        .pg-logo-sub {
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          margin-top: 2px;
        }

        /* ── Heading ── */
        .pg-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(2.6rem, 4.5vw, 3.4rem);
          color: #fff;
          letter-spacing: 0.04em;
          line-height: 1;
          margin-bottom: 6px;
        }

        .pg-subhead {
          font-size: 0.82rem;
          font-weight: 300;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.04em;
          margin-bottom: 32px;
        }

        /* ── Fields ── */
        .pg-field {
          margin-bottom: 18px;
        }

        .pg-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.32);
          margin-bottom: 8px;
          transition: color 0.2s;
        }

        .pg-field.focused .pg-label {
          color: #ff6020;
        }

        .pg-input-wrap {
          position: relative;
        }

        .pg-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 13px 44px 13px 44px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-autofill: off;
        }

        .pg-input::placeholder { color: rgba(255,255,255,0.18); }

        .pg-input:focus {
          border-color: rgba(255,80,20,0.55);
          background: rgba(255,60,0,0.04);
          box-shadow: 0 0 0 3px rgba(255,60,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .pg-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          opacity: 0.28;
          pointer-events: none;
          transition: opacity 0.2s;
        }

        .pg-field.focused .pg-input-icon { opacity: 0.6; }

        /* ── Submit ── */
        .pg-submit {
          width: 100%;
          padding: 14px;
          margin-top: 8px;
          background: linear-gradient(135deg, #ff3d00 0%, #ff6d00 100%);
          border: none;
          border-radius: 8px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem;
          letter-spacing: 0.12em;
          color: #fff;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
          box-shadow: 0 6px 24px rgba(255,60,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12);
        }

        .pg-submit::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }

        .pg-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 32px rgba(255,60,0,0.42), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .pg-submit:active:not(:disabled) { transform: translateY(0); }

        .pg-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .pg-spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Divider ── */
        .pg-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 16px;
        }

        .pg-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }

        .pg-divider-text {
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
        }

        /* ── Demo buttons ── */
        .pg-demo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .pg-demo-btn {
          padding: 9px 6px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.18s ease;
          text-transform: capitalize;
          position: relative;
          overflow: hidden;
        }

        .pg-demo-btn:hover {
          background: rgba(255,60,0,0.08);
          border-color: rgba(255,80,20,0.3);
          color: rgba(255,180,100,0.9);
          transform: translateY(-1px);
        }

        .pg-demo-badge {
          display: block;
          font-size: 0.55rem;
          font-weight: 400;
          opacity: 0.5;
          margin-top: 1px;
          letter-spacing: 0.08em;
        }

        /* ── Footer ── */
        .pg-footer {
          margin-top: 22px;
          text-align: center;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.22);
        }

        .pg-footer a {
          color: #ff6520;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.15s;
        }

        .pg-footer a:hover { color: #ff8840; }

        /* ── Entrance animation ── */
        .pg-form-wrap {
          opacity: 0;
          transform: translateY(18px);
        }
        .pg-form-wrap.visible {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1);
        }

        .pg-left-content {
          opacity: 0;
          transform: translateY(14px);
        }
        .pg-left-content.visible {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.6s 0.1s cubic-bezier(0.22,1,0.36,1), transform 0.6s 0.1s cubic-bezier(0.22,1,0.36,1);
        }

        /* ── Role badge on left panel top ── */
        .pg-badge-row {
          position: absolute;
          top: 28px;
          left: 28px;
          display: flex;
          gap: 7px;
          z-index: 3;
        }

        .pg-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.58rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: 1px solid;
        }

        .pg-badge-admin { border-color: rgba(255,80,0,0.4); color: rgba(255,130,60,0.75); background: rgba(255,60,0,0.07); }
        .pg-badge-trainer { border-color: rgba(255,160,0,0.3); color: rgba(255,190,80,0.7); background: rgba(255,140,0,0.06); }
        .pg-badge-member { border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.03); }

        /* ── Decorative corner lines ── */
        .pg-corner {
          position: absolute;
          width: 28px; height: 28px;
          border-color: rgba(255,80,20,0.28);
          border-style: solid;
        }
        .pg-corner-tl { top: 20px; left: 20px; border-width: 1.5px 0 0 1.5px; border-radius: 2px 0 0 0; }
        .pg-corner-br { bottom: 20px; right: 20px; border-width: 0 1.5px 1.5px 0; border-radius: 0 0 2px 0; }
      `}</style>

      <div className="pg-root">

        {/* ══ LEFT PANEL ══ */}
        <div className="pg-left">
          <div className="pg-left-bg" />
          <div className="pg-left-grid" />
          <div className="pg-left-vignette" />

          {/* Role badges */}
          <div className="pg-badge-row">
            <span className="pg-badge pg-badge-admin">Admin</span>
            <span className="pg-badge pg-badge-trainer">Trainer</span>
            <span className="pg-badge pg-badge-member">Member</span>
          </div>

          {/* Canvas visualizer */}
          <div className="pg-left-canvas">
            <PulseCanvas />
          </div>

          {/* Text content */}
          <div className={`pg-left-content ${mounted ? 'visible' : ''}`}>
            <div className="pg-big-text">
              PUSH<br />
              YOUR<br />
              <span>LIMIT</span>
            </div>
            <div className="pg-accent-line" />
            <p className="pg-tagline">
              Smart gym management.<br />
              Built for athletes.<br />
              Powered by data.
            </p>
            <div className="pg-stats-row">
              <StatTicker value={1240} label="Members" />
              <div className="pg-stat-divider" />
              <StatTicker value={48} label="Classes" />
              <div className="pg-stat-divider" />
              <StatTicker value={12} label="Trainers" />
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="pg-right">

          {/* Corner decorations */}
          <div className="pg-corner pg-corner-tl" />
          <div className="pg-corner pg-corner-br" />

          <div className={`pg-form-wrap ${mounted ? 'visible' : ''}`}>

            {/* Logo */}
            <div className="pg-logo-row" style={{ display: 'flex', justifyContent: 'center', marginBottom: 46 }}>
              <img src={logo} alt="Atlyss" style={{ height: 64, width: 'auto', filter: 'drop-shadow(0 0 20px rgba(255,80,0,0.25))' }} />
            </div>

            {/* Heading */}
            <h1 className="pg-heading">Welcome Back</h1>
            <p className="pg-subhead">Sign in to continue your journey</p>

            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="off">

              {/* Email */}
              <div className={`pg-field ${focused === 'email' ? 'focused' : ''}`}>
                <label className="pg-label">Email Address</label>
                <div className="pg-input-wrap">
                  <svg className="pg-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="you@atlyss.com"
                    className="pg-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`pg-field ${focused === 'password' ? 'focused' : ''}`}>
                <label className="pg-label">Password</label>
                <div className="pg-input-wrap">
                  <svg className="pg-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className="pg-input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: showPassword ? '#f1642a' : 'rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s',
                      zIndex: 10
                    }}
                  >
                    {showPassword ? (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.413 7.552 7.14 4.5 12 4.5c4.86 0 8.587 3.052 10.065 7.178.07.195.07.407 0 .602-1.478 4.126-5.205 7.178-10.065 7.178-4.86 0-8.587-3.052-10.065-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="pg-submit">
                {loading
                  ? <><span className="pg-spinner" />Authenticating...</>
                  : 'Sign In →'
                }
              </button>
            </form>

            {/* Demo Quick Access */}
            <div className="pg-divider">
              <div className="pg-divider-line" />
              <span className="pg-divider-text">Quick Demo Access</span>
              <div className="pg-divider-line" />
            </div>

            <div className="pg-demo-grid">
              {[
                { role: 'admin', sub: 'Full Control' },
                { role: 'trainer', sub: 'Manage Classes' },
                { role: 'member', sub: 'My Workouts' },
              ].map(({ role, sub }) => (
                <button key={role} className="pg-demo-btn" onClick={() => fillDemo(role)}>
                  {role}
                  <span className="pg-demo-badge">{sub}</span>
                </button>
              ))}
            </div>

            <p className="pg-footer">
              New here?{' '}
              <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;