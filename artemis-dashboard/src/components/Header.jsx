import { useState, useEffect } from 'react'
import './Header.css'

const STATUS_CFG = {
  idle:    { color: 'var(--text-muted)', label: 'STANDBY',  glow: false },
  running: { color: '#00ff8c',           label: 'LIVE',     glow: true  },
  paused:  { color: '#ffc328',           label: 'PAUSED',   glow: false },
  done:    { color: '#00dcff',           label: 'COMPLETE', glow: false },
}

export default function Header({ sim, tab, setTab, theme, setTheme }) {
  const [clock, setClock] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const sc = STATUS_CFG[sim.status] || STATUS_CFG.idle
  const modeLabel = sim.mode === 'zone' && sim.zoneId ? `Zone ${sim.zoneId}` : '8 Zones'

  const TABS = [
    { id: 'live',   icon: '◉', label: 'Live Simulation' },
    { id: 'charts', icon: '◈', label: 'Analytics'       },
    { id: 'story',  icon: '◇', label: 'Scenario Report' },
  ]

  return (
    <header className="header">
      {/* Brand */}
      <div className="header-brand">
        <div className="brand-icon">
          <svg width="32" height="30" viewBox="0 0 32 30">
            <polygon points="16,2 30,28 2,28" fill="none" stroke="#ff4141" strokeWidth="2.4" strokeLinejoin="round"/>
            <line x1="16" y1="11" x2="16" y2="19.5" stroke="#ff4141" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="16" cy="24" r="1.5" fill="#ff4141"/>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">ARTEMIS</span>
          <span className="brand-tagline">AI Disaster Response · PPO v9 · xView2 · 92.1% save rate</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="header-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div className="header-right">
        {/* Theme toggle */}
        <button
          className="theme-btn"
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>

        {/* Status indicator */}
        <div className="status-block">
          <div className="status-row">
            <div
              className="status-dot"
              style={{
                background: sc.color,
                boxShadow: sc.glow ? `0 0 12px ${sc.color}, 0 0 24px ${sc.color}40` : 'none',
              }}
            />
            <span className="status-label" style={{ color: sc.color }}>{sc.label}</span>
          </div>
          <div className="status-sub">
            {sim.status !== 'idle'
              ? `Step ${sim.step}/95 · ${modeLabel}`
              : `${modeLabel} · Haiti & Texas & Florida`}
          </div>
        </div>

        {/* Clock */}
        <div className="clock-block">
          <div className="clock-time">
            {clock.toLocaleTimeString('en-US', { hour12: false })}
          </div>
          <div className="clock-date">
            {clock.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </header>
  )
}
