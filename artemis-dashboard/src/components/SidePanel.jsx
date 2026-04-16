import { useState } from 'react'
import './SidePanel.css'

/* All 8 zones in specified order: 4,12,14,26,28,2,13,19 */
const ZONE_LIST = [
  { id:'4',  name:'Zone 4',  region:'Haiti, Caribbean',  disaster:'wind',  affected:1111,  population:9600,   clusters:3, amb:14, buses:2,  boats:0,   beds:80,  shelters:2, shelt_cap:704   },
  { id:'12', name:'Zone 12', region:'Haiti, Caribbean',  disaster:'wind',  affected:10384, population:93600,  clusters:3, amb:133,buses:12, boats:0,   beds:453, shelters:3, shelt_cap:6453  },
  { id:'14', name:'Zone 14', region:'Haiti, Caribbean',  disaster:'wind',  affected:6974,  population:61600,  clusters:2, amb:104,buses:7,  boats:0,   beds:354, shelters:3, shelt_cap:3873  },
  { id:'26', name:'Zone 26', region:'Haiti, Caribbean',  disaster:'wind',  affected:1465,  population:10400,  clusters:3, amb:17, buses:2,  boats:0,   beds:120, shelters:2, shelt_cap:965   },
  { id:'28', name:'Zone 28', region:'Houston, TX',       disaster:'flood', affected:3782,  population:28800,  clusters:3, amb:41, buses:5,  boats:64,  beds:140, shelters:3, shelt_cap:2599  },
  { id:'2',  name:'Zone 2',  region:'Panama City, FL',   disaster:'wind',  affected:13901, population:135200, clusters:2, amb:190,buses:15, boats:0,   beds:646, shelters:3, shelt_cap:8272  },
  { id:'13', name:'Zone 13', region:'Houston, TX',       disaster:'flood', affected:9061,  population:80000,  clusters:2, amb:110,buses:11, boats:152, beds:374, shelters:3, shelt_cap:5823  },
  { id:'19', name:'Zone 19', region:'Houston, TX',       disaster:'flood', affected:3149,  population:21600,  clusters:2, amb:36, buses:4,  boats:53,  beds:123, shelters:3, shelt_cap:2114  },
]

/* ─── Zone Picker Modal ─── */
function ZonePicker({ current, onSelect, onCancel }) {
  const [hov, setHov] = useState(null)
  return (
    <div className="zp-overlay">
      <div className="zp-modal animate-fadeUp">
        <div className="zp-modal-hd">
          <div>
            <div className="zp-modal-title">📍 Select Zone</div>
            <div className="zp-modal-sub">Single-Zone PPO v9 Allocation Run</div>
          </div>
          <button className="close-x" onClick={onCancel}>✕</button>
        </div>

        <div className="zp-zones-grid">
          {ZONE_LIST.map(z => {
            const isHov    = hov === z.id
            const isCur    = current === z.id
            return (
              <button
                key={z.id}
                className={`zp-tile${isHov?' hov':''}${isCur?' active':''}`}
                onMouseEnter={() => setHov(z.id)}
                onMouseLeave={() => setHov(null)}
                onClick={() => onSelect(z.id)}
              >
                <div className="zp-tile-top">
                  <span className={`zp-dis-badge ${z.disaster}`}>
                    {z.disaster === 'flood' ? '🌊' : '🌪'} {z.disaster.toUpperCase()}
                  </span>
                  {isCur && <span className="zp-cur-dot">●</span>}
                </div>
                <div className="zp-tile-name">{z.name}</div>
                <div className="zp-tile-region">{z.region}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Control Panel ─── */
function ControlPanel({ sim }) {
  const { status, step, N_STEPS, speed, start, pause, resume, reset, setSpeed,
          mode, zoneId, switchToAll, switchToZone } = sim
  const [showPicker, setShowPicker] = useState(false)

  const pct    = ((step / (N_STEPS - 1)) * 100).toFixed(1)
  const src    = sim.activeData
  const zMeta  = ZONE_LIST.find(z => z.id === zoneId)
  const zLabel = zMeta?.name ?? null
  const finalPct = src.summary.overall_pct ?? 92.1

  return (
    <div className="card ctrl-card">
      {/* Header */}
      <div className="card-hd">
        <span className="card-title">🎛 Simulation Control</span>
        <span className={`chip ${mode==='zone'?'chip-cyan':'chip-amber'}`}>
          {mode==='zone' && zLabel ? `PPO v9 · ${zLabel}` : 'PPO v9 · All Zones'}
        </span>
      </div>

      <div className="card-body ctrl-body">

        {/* ── Mode selector (idle only) ── */}
        {status === 'idle' && (
          <div className="mode-selector">
            <div className="mode-selector-label">ALLOCATION MODE</div>
            <div className="mode-btns">
              <button
                className={`mode-big-btn${mode==='all'?' sel':''}`}
                onClick={switchToAll}
              >
                <span className="mbb-icon">🌐</span>
                <span className="mbb-title">All 8 Zones</span>
                <span className="mbb-sub">Haiti · TX · FL</span>
              </button>
              <button
                className={`mode-big-btn${mode==='zone'?' sel':''}`}
                onClick={() => setShowPicker(true)}
              >
                <span className="mbb-icon">📍</span>
                <span className="mbb-title">{zLabel ?? 'Single Zone'}</span>
                <span className="mbb-sub">{zLabel ? zMeta?.region : 'Click to select'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Zone banner when selected */}
        {mode === 'zone' && status === 'idle' && (
          <div className="zone-sel-banner">
            <div className="zsb-left">
              <span className={`zsb-dot ${zMeta?.disaster ?? ''}`} />
              <div>
                <div className="zsb-name">{zLabel ?? 'No zone selected'}</div>
                {zMeta && <div className="zsb-meta">{zMeta.region} · {zMeta.affected.toLocaleString()} affected · {zMeta.amb} ambulances</div>}
              </div>
            </div>
            <button className="zsb-change-btn" onClick={() => setShowPicker(true)}>
              Change ↗
            </button>
          </div>
        )}

        {/* ── Action buttons ── */}
        {status === 'idle'    && (
          <button className="run-btn run" onClick={start} disabled={mode==='zone'&&!zoneId}>
            <span className="rbi">▶</span> RUN ALLOCATION
          </button>
        )}
        {status === 'running' && <button className="run-btn pause"  onClick={pause}><span className="rbi">⏸</span> PAUSE</button>}
        {status === 'paused'  && <button className="run-btn resume" onClick={resume}><span className="rbi">▶</span> RESUME</button>}
        {status === 'done'    && <button className="run-btn replay" onClick={start}><span className="rbi">↺</span> REPLAY</button>}

        {/* ── Progress bar ── */}
        <div className="prog-section">
          <div className="prog-meta">
            <span className="prog-step">Step {step}</span>
            <span className="prog-pct">{pct}%</span>
            <span className="prog-of">{step} / {N_STEPS-1}</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{
              width: `${pct}%`,
              background: status==='done'
                ? 'linear-gradient(90deg,#05f585,#00e5ff)'
                : 'linear-gradient(90deg,#ff3d3d,#ff7a28)'
            }}/>
            <div className="phase-pip" style={{left:'20%'}}/>
            <div className="phase-pip" style={{left:'55%'}}/>
          </div>
          <div className="phase-labels">
            <span>Ph1 · Low penalty</span>
            <span>Ph2 · High penalty</span>
            <span>Ph3 · Max penalty</span>
          </div>
        </div>

        {/* ── Speed + Reset ── */}
        <div className="ctrl-row-speed">
          <span className="ctrl-lbl">SPEED</span>
          <div className="spd-group">
            {[1,2,4].map(s => (
              <button key={s} className={`spd-btn${speed===s?' active':''}`} onClick={() => setSpeed(s)}>{s}×</button>
            ))}
          </div>
          {status !== 'idle' && (
            <button className="rst-inline" onClick={reset}>↺</button>
          )}
        </div>

        {/* ── Info box ── */}
        <div className="info-box">
          {[
            ['Model',   'PPO v9 · 5M steps'],
            ['Dataset', 'xView2 · 8 zones'],
            ['Regions', 'Haiti · TX · FL'],
            ['Mode',    mode==='zone'&&zLabel ? `${zLabel} only` : '5 wind · 3 flood'],
            ['Steps',   '96 timesteps'],
            ['Result',  <span key="r" style={{color:'#05f585',fontWeight:900}}>{finalPct}% saved</span>],
          ].map(([k,v]) => (
            <div key={k} className="info-row">
              <span className="info-key">{k}</span>
              <span className="info-val">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {showPicker && (
        <ZonePicker
          current={zoneId}
          onSelect={zid => { switchToZone(zid); setShowPicker(false) }}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

/* ─── Alert Feed ─── */
const ALERT_STYLES = {
  critical: { color:'#ff3d3d', bg:'rgba(255,61,61,0.1)',  border:'rgba(255,61,61,0.35)'   },
  warn:     { color:'#ffc93d', bg:'rgba(255,201,61,0.1)', border:'rgba(255,201,61,0.35)'  },
  info:     { color:'#00e5ff', bg:'rgba(0,229,255,0.1)',  border:'rgba(0,229,255,0.35)'   },
  success:  { color:'#05f585', bg:'rgba(5,245,133,0.1)',  border:'rgba(5,245,133,0.35)'   },
}

function AlertFeed({ alerts }) {
  return (
    <div className="card alert-card">
      <div className="card-hd">
        <span className="card-title">🚨 Alert Feed</span>
        {alerts.length > 0 && <span className="chip chip-red">{alerts.length} active</span>}
      </div>
      <div className="alert-list">
        {alerts.length === 0
          ? <div className="alert-empty">System nominal — no active alerts</div>
          : alerts.map(a => {
              const st = ALERT_STYLES[a.type] || ALERT_STYLES.info
              return (
                <div key={a.id} className="alert-item" style={{ background:st.bg, borderColor:st.border }}>
                  <span className="alert-text" style={{ color: st.color }}>{a.msg}</span>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

/* ─── Mini bar ─── */
function MBar({ label, value, max, color, showZero }) {
  if (!showZero && value === 0) return null
  const pct = Math.min(100, (value / Math.max(1, max)) * 100)
  return (
    <div className="mbar">
      <span className="mbar-lbl">{label}</span>
      <div className="mbar-track">
        <div className="mbar-fill" style={{ width:`${pct}%`, background:color }}/>
      </div>
      <span className="mbar-val">{value.toLocaleString()}</span>
    </div>
  )
}

/* ─── Zone Detail Panel ─── */
function ZoneDetail({ zoneId, sim, onClose }) {
  const src  = sim.activeData
  const zone = src.zones.find(z => z.zone_id === zoneId)
  if (!zone) return null

  const tl     = src.timelines[String(zoneId)]
  if (!tl) return null
  const isDone = sim.status === 'done'
  const frame  = tl[Math.min(sim.step, 95)]

  /* Real final numbers from CSV data */
  const finalInjSaved  = zone.crit_saved + zone.ser_saved + zone.mod_saved
  const finalDispSaved = zone.disp_saved
  const finalSaved     = finalInjSaved + finalDispSaved
  const tot            = zone.crit_init + zone.ser_init + zone.mod_init + zone.disp_init

  /* Display values — real finals when done, live timeline when running */
  const displayCS   = isDone ? zone.crit_saved : frame.cs
  const displaySS   = isDone ? zone.ser_saved  : frame.ss
  const displayMS   = isDone ? zone.mod_saved  : frame.ms
  const displayDS   = isDone ? finalDispSaved  : frame.ds
  const displayCA   = isDone ? 0 : frame.ca
  const displayDA   = isDone ? 0 : frame.da
  const displayDead = isDone ? zone.total_dead : frame.dead
  const displaySv   = isDone ? finalSaved : frame.sv

  const savePct  = isDone ? zone.save_pct : +((displaySv / tot) * 100).toFixed(1)
  const pctColor = savePct >= 90 ? '#05f585' : savePct >= 80 ? '#ffc93d' : '#ff3d3d'

  /* Shelter occupancy: number of displaced people sheltered (not shelter count) */
  const sheltersNow  = isDone ? finalDispSaved : displayDS

  /* Trips from zone data */
  const ambTrips  = zone.amb_trips  || 0
  const busTrips  = zone.bus_trips  || 0
  const boatTrips = zone.boat_trips || 0

  return (
    <div className="card zone-detail animate-fadeUp">
      <div className="card-hd">
        <span className="card-title">📍 {zone.name}</span>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {isDone && <span className="zd-final-badge">FINAL</span>}
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="card-body">

        {/* Top: disaster + region + save % */}
        <div className="zd-top">
          <div>
            <div className="zd-region">{zone.region}</div>
            <span className={`dis-pill ${zone.disaster}`}>
              {zone.disaster === 'flood' ? '🌊 FLOOD' : '🌪 WIND'}
            </span>
          </div>
          <div className="zd-pct-block">
            <span className="zd-pct" style={{ color: pctColor }}>{savePct.toFixed(1)}%</span>
            <span className="zd-pct-lbl">saved</span>
          </div>
        </div>

        {/* Affected + Hospitals summary */}
        <div className="zd-summary-row">
          <div className="zd-stat-chip"><span className="zd-sc-v">{tot.toLocaleString()}</span><span className="zd-sc-l">Affected</span></div>
          <div className="zd-stat-chip" style={{color:'#c084ff'}}><span className="zd-sc-v">{isDone?Math.max(0,(zone.beds_freed||0)-(zone.total_beds||0)).toLocaleString():Math.max(0,(frame.cs||0)+(frame.ss||0)+(frame.ms||0)-2290).toLocaleString()}</span><span className="zd-sc-l">Bed Turns</span></div>
          <div className="zd-stat-chip" style={{color:'#00f0c0'}}><span className="zd-sc-v">{sheltersNow.toLocaleString()}</span><span className="zd-sc-l">Shelt Occ</span></div>
          <div className="zd-stat-chip" style={{color:'#ff3d3d'}}><span className="zd-sc-v">{displayDead}</span><span className="zd-sc-l">Casualties</span></div>
        </div>

        {/* Saved breakdown */}
        <div className="zd-sect-lbl">✅ Saved by Category</div>
        <MBar label="Critical" value={displayCS} max={zone.crit_init} color="#ff3d3d" showZero={true}/>
        <MBar label="Serious"  value={displaySS} max={zone.ser_init}  color="#ff7a28" showZero={true}/>
        <MBar label="Moderate" value={displayMS} max={zone.mod_init}  color="#ffc93d" showZero={true}/>
        <MBar label="Displaced"value={displayDS} max={zone.disp_init} color="#4d9fff" showZero={true}/>

        {/* Still waiting — only when running and patients remain */}
        {!isDone && (displayCA > 0 || displayDA > 0) && (
          <>
            <div className="zd-sect-lbl" style={{marginTop:10,color:'var(--amber)'}}>⏳ Still Waiting</div>
            <MBar label="Crit alive" value={displayCA} max={zone.crit_init} color="#ff3d3d" showZero={false}/>
            <MBar label="Disp left"  value={displayDA} max={zone.disp_init} color="#8b94b8" showZero={false}/>
          </>
        )}

        {/* Trips */}
        <div className="zd-sect-lbl" style={{marginTop:10}}>🚗 Deployment Trips</div>
        <div className="trip-grid">
          <div className="trip-cell">
            <span className="tc-icon">🚑</span>
            <strong className="tc-val" style={{color:'#ff3d3d'}}>{ambTrips}</strong>
            <span className="tc-lbl">Amb</span>
          </div>
          {busTrips > 0 && (
            <div className="trip-cell">
              <span className="tc-icon">🚌</span>
              <strong className="tc-val" style={{color:'#ffc93d'}}>{busTrips}</strong>
              <span className="tc-lbl">Bus</span>
            </div>
          )}
          {boatTrips > 0 && (
            <div className="trip-cell">
              <span className="tc-icon">⛵</span>
              <strong className="tc-val" style={{color:'#4d9fff'}}>{boatTrips}</strong>
              <span className="tc-lbl">Boat</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="zd-footer">
          <span>Step {isDone ? 95 : sim.step} / 95</span>
          <span style={{color:'#ff3d3d'}}>💀 {displayDead} casualties</span>
        </div>

      </div>
    </div>
  )
}

/* ─── SidePanel root ─── */
export default function SidePanel({ sim }) {
  return (
    <div className="side-panel">
      <ControlPanel sim={sim} />
      <AlertFeed alerts={sim.alerts} />
      {sim.selectedZone != null && (
        <ZoneDetail
          zoneId={sim.selectedZone}
          sim={sim}
          onClose={() => sim.setSelectedZone(null)}
        />
      )}
    </div>
  )
}
