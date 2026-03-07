import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

/* ─── Animated Pulse Bars (same as Login) ─── */
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

/* ─── Main Register Component ─── */
const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ── Already logged in? Redirect to dashboard ──
  useEffect(() => {
    if (!authLoading && user) {
      navigate(`/dashboard/${user.role}`, { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  // Show nothing while auth is being checked
  if (authLoading) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      const user = await register({ name, email, password, role: 'admin' });
      navigate(`/dashboard/${user.role}`);
    } catch { /* handled in AuthContext */ } finally { setLoading(false); }
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
          bottom: 0; left: 0; right: 0;
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

        .pg-perks {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 32px;
          padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .pg-perk {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pg-perk-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff3d00, #ff8c00);
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(255,80,0,0.5);
        }

        .pg-perk-text {
          font-size: 0.76rem;
          color: rgba(255,255,255,0.38);
          letter-spacing: 0.04em;
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
          top: -200px; right: -200px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(255,50,0,0.055) 0%, transparent 65%);
          pointer-events: none;
        }
        .pg-right::after {
          content: '';
          position: absolute;
          bottom: -150px; left: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(255,120,0,0.04) 0%, transparent 65%);
          pointer-events: none;
        }

        .pg-form-wrap {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
        }

        .pg-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 38px;
        }

        .pg-logo-icon {
          width: 48px; height: 48px;
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

        .pg-logo-sub {
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          margin-top: 2px;
        }

        .pg-admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255,80,0,0.35);
          background: rgba(255,60,0,0.08);
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,130,60,0.85);
          margin-bottom: 16px;
        }

        .pg-admin-badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #ff5500;
          box-shadow: 0 0 5px rgba(255,80,0,0.7);
        }

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

        .pg-field { margin-bottom: 18px; }

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

        .pg-field.focused .pg-label { color: #ff6020; }

        .pg-input-wrap { position: relative; }

        .pg-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 13px 16px 13px 44px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .pg-input::placeholder { color: rgba(255,255,255,0.18); }

        .pg-input:focus {
          border-color: rgba(255,80,20,0.55);
          background: rgba(255,60,0,0.04);
          box-shadow: 0 0 0 3px rgba(255,60,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .pg-input-icon {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          width: 16px; height: 16px;
          opacity: 0.28;
          pointer-events: none;
          transition: opacity 0.2s;
        }

        .pg-field.focused .pg-input-icon { opacity: 0.6; }

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
        .pg-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

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

        .pg-corner {
          position: absolute;
          width: 28px; height: 28px;
          border-color: rgba(255,80,20,0.28);
          border-style: solid;
        }
        .pg-corner-tl { top: 20px; left: 20px; border-width: 1.5px 0 0 1.5px; border-radius: 2px 0 0 0; }
        .pg-corner-br { bottom: 20px; right: 20px; border-width: 0 1.5px 1.5px 0; border-radius: 0 0 2px 0; }

        .pg-badge-row {
          position: absolute;
          top: 28px; left: 28px;
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

        .pg-badge-admin   { border-color: rgba(255,80,0,0.4);    color: rgba(255,130,60,0.75);  background: rgba(255,60,0,0.07); }
        .pg-badge-trainer { border-color: rgba(255,160,0,0.3);   color: rgba(255,190,80,0.7);   background: rgba(255,140,0,0.06); }
        .pg-badge-member  { border-color: rgba(255,255,255,0.1);  color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.03); }
      `}</style>

      <div className="pg-root">

        {/* ══ LEFT PANEL ══ */}
        <div className="pg-left">
          <div className="pg-left-bg" />
          <div className="pg-left-grid" />
          <div className="pg-left-vignette" />

          <div className="pg-badge-row">
            <span className="pg-badge pg-badge-admin">Admin</span>
            <span className="pg-badge pg-badge-trainer">Trainer</span>
            <span className="pg-badge pg-badge-member">Member</span>
          </div>

          <div className="pg-left-canvas">
            <PulseCanvas />
          </div>

          <div className={`pg-left-content ${mounted ? 'visible' : ''}`}>
            <div className="pg-big-text">
              TAKE<br />
              FULL<br />
              <span>CONTROL</span>
            </div>
            <div className="pg-accent-line" />
            <p className="pg-tagline">
              Admin access.<br />
              Complete oversight.<br />
              Built for leaders.
            </p>
            <div className="pg-perks">
              {[
                'Manage members & trainers',
                'Full class scheduling control',
                'Revenue & analytics dashboard',
                'System-wide configuration',
              ].map((perk) => (
                <div key={perk} className="pg-perk">
                  <div className="pg-perk-dot" />
                  <span className="pg-perk-text">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="pg-right">
          <div className="pg-corner pg-corner-tl" />
          <div className="pg-corner pg-corner-br" />

          <div className={`pg-form-wrap ${mounted ? 'visible' : ''}`}>

            {/* Logo */}
            <div className="pg-logo-row">
              <div className="pg-logo-icon">
                <img src={logo} alt="Atlyss" />
              </div>
              <div>
                <div className="pg-logo-name">Atlyss</div>
                <div className="pg-logo-sub">Smart Gym Management</div>
              </div>
            </div>

            {/* Admin badge pill */}
            <div className="pg-admin-badge">
              <div className="pg-admin-badge-dot" />
              Admin Registration
            </div>

            <h1 className="pg-heading">Create Account</h1>
            <p className="pg-subhead">Set up your primary admin account</p>

            <form onSubmit={handleSubmit} autoComplete="off">

              {/* Full Name */}
              <div className={`pg-field ${focused === 'name' ? 'focused' : ''}`}>
                <label className="pg-label">Full Name</label>
                <div className="pg-input-wrap">
                  <svg className="pg-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    placeholder="Admin Name"
                    className="pg-input"
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    placeholder="admin@atlyss.com"
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className="pg-input"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="pg-submit">
                {loading
                  ? <><span className="pg-spinner" />Creating Account...</>
                  : 'Register Admin Account →'
                }
              </button>
            </form>

            <p className="pg-footer">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;