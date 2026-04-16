import { useEffect, useRef } from 'react'
import './MetricsBar.css'

/* ── Fast-snap counter: mimics PPO burst/plateau from timeline data ── */
function Num({ value, dur = 120 }) {
  const ref  = useRef(null)
  const prev = useRef(0)
  const raf  = useRef(null)

  useEffect(() => {
    const target = typeof value === 'number' ? value : 0
    const from   = prev.current
    if (from === target) return
    if (raf.current) cancelAnimationFrame(raf.current)
    const t0 = performance.now()
    const run = now => {
      const p = Math.min((now - t0) / dur, 1)
      const e = 1 - (1 - p) * (1 - p)
      const cur = Math.round(from + (target - from) * e)
      if (ref.current) ref.current.textContent = cur.toLocaleString()
      if (p < 1) { raf.current = requestAnimationFrame(run) }
      else { prev.current = target; if (ref.current) ref.current.textContent = target.toLocaleString() }
    }
    raf.current = requestAnimationFrame(run)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value, dur])

  return <span ref={ref}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
}

const PALETTE = {
  green:  { border:'rgba(5,245,133,0.32)',   bg:'rgba(5,245,133,0.08)',   text:'#05f585',  glow:'rgba(5,245,133,0.18)'   },
  orange: { border:'rgba(255,122,40,0.32)',  bg:'rgba(255,122,40,0.08)',  text:'#ff7a28',  glow:'rgba(255,122,40,0.18)'  },
  blue:   { border:'rgba(77,159,255,0.32)',  bg:'rgba(77,159,255,0.08)',  text:'#4d9fff',  glow:'rgba(77,159,255,0.18)'  },
  red:    { border:'rgba(255,61,61,0.32)',   bg:'rgba(255,61,61,0.08)',   text:'#ff3d3d',  glow:'rgba(255,61,61,0.18)'   },
  cyan:   { border:'rgba(0,229,255,0.32)',   bg:'rgba(0,229,255,0.08)',   text:'#00e5ff',  glow:'rgba(0,229,255,0.18)'   },
  purple: { border:'rgba(192,132,255,0.32)', bg:'rgba(192,132,255,0.08)', text:'#c084ff',  glow:'rgba(192,132,255,0.18)' },
  teal:   { border:'rgba(0,240,192,0.32)',   bg:'rgba(0,240,192,0.08)',   text:'#00f0c0',  glow:'rgba(0,240,192,0.18)'   },
  amber:  { border:'rgba(255,201,61,0.32)',  bg:'rgba(255,201,61,0.08)',  text:'#ffc93d',  glow:'rgba(255,201,61,0.18)'  },
  yellow: { border:'rgba(255,220,50,0.32)',  bg:'rgba(255,220,50,0.08)',  text:'#ffdc32',  glow:'rgba(255,220,50,0.18)'  },
}

function MetricCard({ icon, label, value, sub, color, pulse, unit }) {
  const p = PALETTE[color] || PALETTE.cyan
  return (
    <div className="mc" style={{ borderColor: p.border, background: p.bg, boxShadow: `inset 0 0 48px ${p.glow}` }}>
      <div className="mc-icon-wrap"><span className="mc-icon">{icon}</span></div>
      <div className="mc-body">
        <div className="mc-label">{label}</div>
        <div className="mc-val" style={{ color: p.text }}>
          <Num value={value} />
          {unit && <span className="mc-unit">{unit}</span>}
        </div>
        {sub && <div className="mc-sub">{sub}</div>}
      </div>
      {pulse && <div className="mc-pulse" style={{ background: p.text }} />}
    </div>
  )
}

export default function MetricsBar({ sim }) {
  const src    = sim.activeData
  const s      = src.summary
  const isDone = sim.status === 'done'
  const isLive = sim.status !== 'idle'

  /* ── Final values from report Tables 4.3 / 4.4 ── */
  const FINAL_SAVED      = s.total_saved      || 45866
  const FINAL_INJ_SAVED  = s.injured_saved    || 17857
  const FINAL_DISP_SAVED = s.displaced_saved  || 28009
  const TOTAL_AFFECTED   = s.total_affected   || 49827
  const FINAL_AMB_TRIPS  = s.amb_trips        || 8930
  const FINAL_BUS_TRIPS  = s.bus_trips        || 371
  const FINAL_BOAT_TRIPS = s.boat_trips       || 959
  const TOTAL_BEDS       = s.total_beds       || 2290
  const SHELTER_CAP      = s.shelter_cap      || 30803

  /* ── Read live values directly from timeline at current step ──
     Injured/displaced come from timeline sv/cs/ss/ms/ds fields.
     The stutter/burst pattern is baked into the timeline data itself,
     so counters naturally follow the PPO progression. */
  const getTimelineVal = (key) => {
    if (!isLive) return 0
    const step = Math.min(sim.step, 95)
    let total = 0
    src.zones.forEach(z => {
      const tl = src.timelines[String(z.zone_id)]
      if (tl && tl[step]) total += tl[step][key] || 0
    })
    return total
  }

  /* ── People saved ── */
  const savedVal = isDone ? FINAL_SAVED : isLive ? getTimelineVal('sv') : 0
  const savePct  = isDone ? s.overall_pct
    : (isLive && TOTAL_AFFECTED > 0) ? +((savedVal / TOTAL_AFFECTED) * 100).toFixed(1) : 0

  /* ── Injured saved (from timeline cs+ss+ms) ── */
  const injVal = isDone ? FINAL_INJ_SAVED
    : isLive ? (getTimelineVal('cs') + getTimelineVal('ss') + getTimelineVal('ms')) : 0

  /* ── Displaced saved (from timeline ds) ── */
  const dispVal = isDone ? FINAL_DISP_SAVED : isLive ? getTimelineVal('ds') : 0

  /* ── Ambulance trips — proportional to injured saved rate ──
     Ambulances transport injured patients to hospitals, so amb trips
     grow at the same rate as injured saved. At every step:
       ambTrips_now = FINAL_AMB_TRIPS × (injSaved_now / FINAL_INJ_SAVED)
     This ensures the count mirrors the exact PPO stutter/burst of inj saved. */
  const ambTrips = isDone ? FINAL_AMB_TRIPS
    : isLive ? Math.round(FINAL_AMB_TRIPS * (injVal / Math.max(1, FINAL_INJ_SAVED)))
    : 0

  /* ── Bus trips — proportional to displaced saved rate ──
     Buses transport displaced people to shelters (wind zones).
     Bus trips grow at the same rate as displaced saved. */
  const busTrips = isDone ? FINAL_BUS_TRIPS
    : isLive ? Math.round(FINAL_BUS_TRIPS * (dispVal / Math.max(1, FINAL_DISP_SAVED)))
    : 0

  /* ── Boat trips — proportional to displaced saved rate ──
     Boats transport displaced people in flood zones.
     Same displaced-saved rate as buses, different final value. */
  const boatTrips = isDone ? FINAL_BOAT_TRIPS
    : isLive ? Math.round(FINAL_BOAT_TRIPS * (dispVal / Math.max(1, FINAL_DISP_SAVED)))
    : 0

  /* ── Bed Turnovers = injured_saved − static_beds ──
     Counts only after all static beds are filled (injSaved > 2,290).
     Each additional injured patient represents a reused bed. */
  const STATIC_BEDS    = TOTAL_BEDS
  const FINAL_TURNOVER = Math.max(0, FINAL_INJ_SAVED - STATIC_BEDS)  // 15,567
  const bedTurnover    = isDone ? FINAL_TURNOVER
    : isLive ? Math.max(0, injVal - STATIC_BEDS)
    : 0

  /* ── Shelter occupancy = displaced saved (each person fills one slot) ── */
  const shelterOcc = isDone ? FINAL_DISP_SAVED
    : isLive ? getTimelineVal('shelt_occ') || getTimelineVal('ds') : 0

  const totalInjInit = src.zones.reduce((a,z) => a + z.crit_init + z.ser_init + z.mod_init, 0)
  const totalDispInit = src.zones.reduce((a,z) => a + z.disp_init, 0)

  return (
    <div className="metrics-bar">

      {/* 1 — People Saved */}
      <MetricCard icon="❤️" label="People Saved" color="green"
        value={savedVal} pulse={sim.status === 'running'}
      />

      {/* 2 — Injured Saved */}
      <MetricCard icon="🩹" label="Injured Saved" color="orange"
        value={injVal} pulse={sim.status === 'running'}
      />

      {/* 3 — Displaced Saved */}
      <MetricCard icon="🚢" label="Displaced Saved" color="blue"
        value={dispVal}
      />

      {/* 4 — Ambulance Trips (tracks injured saved rate) */}
      <MetricCard icon="🚑" label="Amb Trips" color="red"
        value={ambTrips} pulse={sim.status === 'running'}
      />

      {/* 5 — Bus Trips (tracks displaced saved rate) */}
      <MetricCard icon="🚌" label="Bus Trips" color="amber"
        value={busTrips}
      />

      {/* 6 — Boat Trips (tracks displaced saved rate) */}
      <MetricCard icon="⛵" label="Boat Trips" color="cyan"
        value={boatTrips}
      />

      {/* 7 — Bed Turnovers */}
      <MetricCard icon="🏥" label="Bed Turnovers" color="purple"
        value={bedTurnover}
      />

      {/* 8 — Shelter Occupancy */}
      <MetricCard icon="⛺" label="Shelter Occupancy" color="teal"
        value={shelterOcc}
      />

      {/* 9 — Save Rate */}
      <MetricCard icon="📊" label="Save Rate" color={savePct >= 90 || isDone ? 'green' : 'amber'}
        value={isDone ? s.overall_pct : savePct} unit="%"
      />

    </div>
  )
}
