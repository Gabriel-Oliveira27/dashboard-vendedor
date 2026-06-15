"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";
import { ThemeProvider, useTheme, THEMES } from "@/contexts/ThemeContext";
import type { Theme } from "@/types";

/* ── Inline SVG icons to avoid lucide className issues ── */
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m2 7 10 7 10-7"/>
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function IconEye({ off }: { off?: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}
function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  dark:     <IconMoon />,
  light:    <IconSun />,
  violet:   <IconSparkle />,
  midnight: <IconSparkle />,
  forest:   <IconSun />,
  rose:     <IconSun />,
};

function LoginContent() {
  const { theme, cycleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sublime_user");
      if (raw) window.location.replace("/dashboard");
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) { setError("Preencha o e-mail e a senha."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await API.login(email, senha);
      if (res?.usuario) {
        sessionStorage.setItem("sublime_user", JSON.stringify(res.usuario));
        window.location.replace("/dashboard");
      } else {
        setError("Resposta inesperada do servidor.");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Falha ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(28px) scale(.97); }
          to   { opacity: 1; transform: none; }
        }
        .login-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: var(--bg);
          position: relative;
          overflow: hidden;
        }
        .login-grid {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.45;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, #000 55%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, #000 55%, transparent 100%);
        }
        .login-glow {
          position: fixed;
          width: 640px; height: 640px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 68%);
          pointer-events: none;
          z-index: 0;
        }
        .login-theme-btn {
          position: fixed;
          top: 1rem; right: 1rem;
          z-index: 10;
          padding: 0.45rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          cursor: pointer;
          transition: all .2s;
          display: flex; align-items: center;
        }
        .login-theme-btn:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: var(--surface-hover);
        }
        .login-card-wrap {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
        }
        .login-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 0 0 1px rgba(124,58,237,.07), 0 28px 72px rgba(0,0,0,.55);
          animation: card-in .5s cubic-bezier(.16,1,.3,1) both;
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .login-brand-icon {
          width: 42px; height: 42px;
          border-radius: 11px;
          background: linear-gradient(135deg, var(--accent), #5b21b6);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 1.15rem;
          box-shadow: 0 4px 18px rgba(124,58,237,.4);
          flex-shrink: 0;
        }
        .login-brand-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .login-brand-text strong {
          color: var(--text);
          font-weight: 700;
        }
        .login-title {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text);
          margin-bottom: 0.35rem;
        }
        .login-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 2rem;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .login-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .login-input-wrap {
          position: relative;
        }
        .login-input-icon {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-dim);
          pointer-events: none;
          display: flex;
        }
        .login-input {
          width: 100%;
          height: 48px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0 1rem 0 2.6rem;
          font-size: 0.95rem;
          font-family: inherit;
          color: var(--text);
          transition: border .2s, box-shadow .2s;
          outline: none;
        }
        .login-input::placeholder { color: var(--text-dim); }
        .login-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(124,58,237,.18);
        }
        .login-input-pr { padding-right: 2.8rem; }
        .login-eye {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-dim);
          padding: 0.3rem;
          display: flex;
          transition: color .2s;
        }
        .login-eye:hover { color: var(--text); }
        .login-submit {
          margin-top: 0.25rem;
          width: 100%;
          height: 48px;
          border-radius: 12px;
          border: none;
          background: var(--accent);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 18px rgba(124,58,237,.38);
          transition: opacity .2s, transform .15s;
        }
        .login-submit:hover:not(:disabled) { opacity: .92; }
        .login-submit:active:not(:disabled) { transform: scale(.98); }
        .login-submit:disabled { opacity: .6; cursor: not-allowed; }
        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: rgba(239,68,68,.12);
          border: 1px solid rgba(239,68,68,.3);
          color: var(--danger);
          font-size: 0.875rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin .8s linear infinite; }
      `}</style>

      <div className="login-page">
        <div className="login-grid" />
        <div className="login-glow" />

        {/* Theme toggle */}
        <button className="login-theme-btn" onClick={cycleTheme} title={"Tema: " + THEMES[theme].label}>
          {THEME_ICONS[theme]}
        </button>

        <div className="login-card-wrap">
          <div className="login-card">
            {/* Brand */}
            <div className="login-brand">
              <div className="login-brand-icon">
                <svg width="26" height="26" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="7" width="26" height="6" rx="2.5" fill="white" fillOpacity="0.95"/>
                  <rect x="14" y="4" width="8" height="4" rx="2" fill="white" fillOpacity="0.7"/>
                  <path d="M7 13h22l-2 16a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2L7 13z" fill="white" fillOpacity="0.25"/>
                  <path d="M7 13h22l-2 16a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2L7 13z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M11.5 17 L10.5 24" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4"/>
                </svg>
              </div>
              <span className="login-brand-text">
                Tupper<strong>Store</strong>
              </span>
            </div>

            <h1 className="login-title">Bem-vindo de volta</h1>
            <p className="login-subtitle">Acesse seu painel de vendas</p>

            <form className="login-form" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="login-field">
                <label className="login-label">E-mail</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon"><IconMail /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className="login-input"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="login-field">
                <label className="login-label">Senha</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon"><IconLock /></span>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="login-input login-input-pr"
                  />
                  <button type="button" className="login-eye" onClick={() => setShowPwd(!showPwd)}>
                    <IconEye off={showPwd} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <>
                    <svg className="spin" viewBox="0 0 24 24" fill="none" width="20" height="20">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3"
                        strokeDasharray="31.4 31.4" strokeLinecap="round" />
                    </svg>
                    Entrando…
                  </>
                ) : "Entrar"}
              </button>

              {/* Error */}
              {error && (
                <div className="login-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <ThemeProvider>
      <LoginContent />
    </ThemeProvider>
  );
}
