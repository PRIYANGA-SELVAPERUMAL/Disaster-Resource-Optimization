import { SIM_DATA } from '../data/simulationData'
import './StoryPage.css'

function Stat({ label, value, unit, color }) {
  return (
    <div className="stat-box" style={{borderColor:`${color}28`,background:`${color}09`}}>
      <div className="stat-val" style={{color}}>{value}<span className="stat-unit">{unit}</span></div>
      <div className="stat-lbl">{label}</div>
    </div>
  )
}

function ZCard({ zone }) {
  const pct    = zone.save_pct.toFixed(2)
  const injSv  = zone.crit_saved + zone.ser_saved + zone.mod_saved
  const injInit= zone.crit_init  + zone.ser_init  + zone.mod_init
  const injPct = injInit > 0 ? ((injSv / injInit) * 100).toFixed(1) : '0.0'
  const critPct= zone.crit_init > 0 ? ((zone.crit_saved / zone.crit_init) * 100).toFixed(0) : '0'
  const col    = +pct >= 92 ? '#05f585' : +pct >= 90 ? '#00e676' : '#ffb81c'
  const isFlood= zone.disaster === 'flood'

  return (
    <div className="zcard" style={{borderColor:isFlood?'rgba(77,143,255,0.22)':'rgba(255,107,26,0.22)'}}>
      <div className="zcard-hd">
        <span className="zcard-name">{zone.name}</span>
        <span className={`dis-tag ${zone.disaster}`}>{isFlood?'🌊':'🌪'} {zone.disaster}</span>
        <span className="zcard-pct" style={{color:col}}>{pct}%</span>
      </div>
      <div className="zcard-region">{zone.region}</div>
      <div className="zcard-inj-pct" style={{color:'#ff6b1a',fontSize:9,marginBottom:6}}>
        Inj save: {injPct}% · Critical: {critPct}% · {zone.affected.toLocaleString()} affected
      </div>
      <div className="zcard-grid">
        {[
          ['#ff2d2d', zone.crit_saved,                          'Crit saved'],
          ['#ff6b1a', zone.ser_saved,                           'Ser saved'],
          ['#ffb81c', zone.mod_saved,                           'Mod saved'],
          ['#4d8fff', zone.disp_saved,                          'Disp evac'],
          ['#8b94b8', zone.total_dead,                          'Casualties'],
          ['#ff3d3d', zone.amb_trips,                           'Amb trips'],
          ['#c084ff', Math.max(0,(zone.beds_freed||0)-(zone.total_beds||0)), 'Bed Turnovers'],
          ['#00e676', zone.affected,                            'Affected'],
        ].map(([c,v,l])=>(
          <div key={l} className="zstat" style={{borderColor:`${c}18`}}>
            <span className="zs-v" style={{color:c}}>{typeof v==='number'?v.toLocaleString():v}</span>
            <span className="zs-l">{l}</span>
          </div>
        ))}
      </div>
      {/* Bus and boat as separate rows */}
      {(zone.bus_trips > 0 || zone.boat_trips > 0) && (
        <div className="zcard-transport">
          {zone.bus_trips > 0 && (
            <div className="zt-box" style={{borderColor:'rgba(255,201,61,0.2)',background:'rgba(255,201,61,0.05)'}}>
              <span className="zt-icon">🚌</span>
              <span className="zt-val" style={{color:'#ffc93d'}}>{zone.bus_trips.toLocaleString()}</span>
              <span className="zt-lbl">Bus Trips</span>
            </div>
          )}
          {zone.boat_trips > 0 && (
            <div className="zt-box" style={{borderColor:'rgba(77,159,255,0.2)',background:'rgba(77,159,255,0.05)'}}>
              <span className="zt-icon">⛵</span>
              <span className="zt-val" style={{color:'#4d9fff'}}>{zone.boat_trips.toLocaleString()}</span>
              <span className="zt-lbl">Boat Trips</span>
            </div>
          )}
        </div>
      )}
      <div className="zcard-shelt">
        <span style={{color:'#00f0c0'}}>
          ⛺ Shelter occ: {(zone.shelter_occ_final||zone.disp_saved).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default function StoryPage({ sim }) {
  const src = sim ? sim.activeData : SIM_DATA
  const s   = src.summary
  const isZone = sim?.mode === 'zone'
  const zLabel = sim?.zoneId ? `Zone ${sim.zoneId}` : null
  const greedyDelta = (s.overall_pct - (src.comparison.overall[0]??85.8)).toFixed(1)
  const dqnDelta    = (s.overall_pct - (src.comparison.overall[1]??88.0)).toFixed(1)

  return (
    <div className="story-page">

      <div className="story-hero card">
        <div className="hero-eyebrow">SIMULATION SCENARIO REPORT · xView2 DATASET · PPO v9{isZone ? ` · ${zLabel} Mode` : ''}</div>
        <h1 className="hero-h1">ARTEMIS Response — {isZone ? `${zLabel} Single-Zone Allocation` : 'Multi-Continent Disaster Event'}</h1>
        <p className="hero-p">
          {isZone ? (
            <>Single-zone PPO v9 allocation for <strong>{zLabel}</strong> — {s.total_affected.toLocaleString()} affected individuals across
            {s.total_hospitals} hospital(s) in a 96-timestep simulation (each step ≈ 45 min).</>
          ) : (
            <>A simultaneous multi-zone disaster struck three geographic regions: 4 wind zones across Haiti and Caribbean,
            3 flood zones across Greater Houston Texas, and 1 major wind event at Panama City Florida — totalling <strong>49,827 affected</strong> across
            8 zones. The PPO v9 agent coordinated ambulances, buses, and boats across 20 hospitals in a 96-timestep simulation.</>
          )}
        </p>
        <div className="hero-chips">
          <span className="oc green">✅ {s.overall_pct}% overall save rate — {s.total_saved.toLocaleString()} / {s.total_affected.toLocaleString()} rescued</span>
          <span className="oc amber">⚠ {(s.total_dead||1462).toLocaleString()} casualties</span>
          <span className="oc blue">📊 +{greedyDelta}pp vs Greedy · +{dqnDelta}pp vs DQN</span>
          {!isZone && <span className="oc orange">⛵ 3 flood zones · boat fleets · 96 timesteps</span>}
        </div>
      </div>

      <div className="stats-grid">
        <Stat label="Overall Save Rate"   value={s.overall_pct||92.1}    unit="%"  color="#00ff8c"/>
        <Stat label="Total Saved"         value={s.total_saved||45866}   unit=""   color="#00dcff"/>
        <Stat label="Injured Saved"       value={s.injured_saved||17857} unit=""   color="#ff7828"/>
        <Stat label="Critical Saved"      value={s.critical_saved||3562} unit=""   color="#ff4141"/>
        <Stat label="Serious Saved"       value={s.serious_saved||6235}  unit=""   color="#ff7828"/>
        <Stat label="Moderate Saved"      value={s.moderate_saved||8060} unit=""   color="#ffc828"/>
        <Stat label="Displaced Evacuated" value={s.displaced_saved||28009}unit=""  color="#4d96ff"/>
        <Stat label="Total Casualties"    value={s.total_dead||1462}     unit=""   color="#8b94b8"/>
        <Stat label="Amb Trips"           value={s.amb_trips||8930}      unit=""   color="#ff4141"/>
        <Stat label="Bus Trips"           value={s.bus_trips||371}       unit=""   color="#ffc828"/>
        <Stat label="Boat Trips"          value={s.boat_trips||959}      unit=""   color="#4d96ff"/>
        <Stat label="Timesteps"           value="96"                     unit=" steps" color="#ffc828"/>
      </div>

      <div className="narr-grid">
        <div className="narr-block card">
          <h3>🧠 PPO Algorithm — Training Mechanics</h3>
          <p>
            The PPO agent trained for <strong>5 million environment steps</strong> using a 3-phase progressive
            training strategy. In the early phase, the agent is trained with a low penalty for patient deaths —
            this forces it to first learn the basics of finding clusters and dispatching vehicles before worrying
            about minimising casualties. In the middle phase, the death penalty is raised significantly, pushing
            the agent to prioritise critical patients and coordinate across zones simultaneously. In the final phase,
            the death penalty is set to its maximum — every preventable death costs the agent heavily, driving it to
            master bed reuse cycling, pre-positioned flood boats, and fine-grained triage ordering.
            Each of 96 timesteps (45 min each) the agent receives the current state of every zone — injured counts
            by severity, displaced populations, hospital bed availability, and vehicle positions — and outputs a
            complete allocation decision. Final reward: <strong>+410.4</strong> (starting from −844 at the
            beginning of training), confirming full convergence to an effective rescue policy.
          </p>
        </div>

        <div className="narr-block card">
          <h3>PPO vs DQN and Greedy — What the Numbers Mean</h3>
          <p>
            <strong>Greedy baseline (85.8%):</strong> always sends the nearest available vehicle to the
            highest-count cluster regardless of severity — ignores bed capacity and moderate patients.{' '}
            <strong>DQN baseline (88.0%):</strong> learns a Q-value per action, captures
            immediate reward better than greedy but struggles with long-horizon multi-zone coordination and
            gives inconsistent displaced performance.{' '}
            <strong>PPO (92.1%):</strong> on-policy with clipped surrogate objective ensures stable learning of
            multi-step coordination. Key advantage — PPO reserves ~20% ambulance capacity for moderate patients
            before they deteriorate to critical, preventing a cascade that greedy and DQN miss.
            Injured save: PPO 91.7% vs DQN 91.2% vs Greedy 92.4% — injured save is high across all because
            injured get priority; displaced is where PPO excels most: 89.0% vs 85.7% (DQN) vs 81.1% (Greedy).
          </p>
        </div>

        <div className="narr-block card">
          <h3>🌊 Flood Zone Performance (Zones 28, 13, 19)</h3>
          <p>
            All three Houston flood zones exceeded <strong>91% save rates</strong> — outperforming greedy by ~6pp.
            Zone 13 (9,061 affected) led at <strong>92.3%</strong> with 531 boat trips (largest flood zone),
            1,527 ambulance trips. Zone 28 (3,782 affected) achieved <strong>91.5%</strong> with 235 boat trips.
            Zone 19 (3,149 affected) at <strong>92.1%</strong> with 193 boat trips, zero bus support (roads flooded).
            The critical PPO advantage in flood zones: boat launch at timestep T+6 versus the greedy baseline's T+16,
            reducing critical patient exposure time by 10 timesteps earlier.
          </p>
        </div>

        <div className="narr-block card">
          <h3>🌪 Wind Zone Performance (Zones 2, 4, 12, 14, 26)</h3>
          <p>
            Zone 2 (Panama City FL, 13,901 affected) achieved <strong>92.5%</strong> — 12,854 rescued,
            2,649 ambulance trips, 152 bus trips. Zone 14 (Haiti E, 6,974 affected) reached <strong>92.4%</strong>
            with 1,454 ambulance trips. Zone 12 (Haiti N, 10,384 affected, 9,518 saved) hit <strong>91.7%</strong>.
            Zones 4 and 26 (Haiti, ~1,100–1,465 affected) at <strong>90.2% and 90.4%</strong> respectively.
            All wind zones show PPO's simultaneous ambulance+bus coordination — vehicles dispatch in parallel
            from step T+2 rather than greedy's sequential approach.
          </p>
        </div>
      </div>

      <div className="sect-hd">📍 Per-Zone Outcome — {src.zones.length === 1 ? '1 Zone (Single-Zone Mode)' : 'All 8 Zones'}</div>
      <div className="zcards-grid">
        {src.zones.map(z=><ZCard key={z.zone_id} zone={z}/>)}
      </div>

      <div className="card comp-table-card">
        <div className="card-hd">
          <span className="card-title">📉 Full Method Comparison — PPO vs DQN vs Greedy</span>
          <span className="chip chip-green">PPO v9 Best Overall</span>
        </div>
        <div className="card-body">
          <table className="ctable">
            <thead>
              <tr>
                {['Metric','Greedy (85.8%)', 'DQN (88.0%)', 'PPO v9 (Ours)','Δ vs Greedy','Key Insight'].map(h=>(
                  <th key={h} style={h==='PPO v9 (Ours)'?{color:'var(--green)'}:{}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Overall Save %',   '85.8', '88.0', '92.1%', '+6.3pp', 'PPO multi-zone coordination beats DQN by 4.1pp, Greedy by 6.3pp'],
                ['Injured Save %',   '92.4', '91.2', '91.7%', '−0.7pp', 'Injured prioritised by all; PPO balances injured + displaced equally'],
                ['Displaced Save %', '81.1', '85.7', '89.0%', '+7.9pp', 'PPO pre-positions buses before peak crowds; flood boats launched T+6'],
                ['Total Casualties', '1,569','1,519','1,462', '−107',   'PPO: 107 fewer casualties vs Greedy; monotonically decreasing'],
                ['Timesteps',        '96',   '96',   '96',   '—',       '1 step = 45 min; 96 steps = 72h horizon'],
              ].map((r,i)=>(
                <tr key={i}>
                  <td>{r[0]}</td>
                  <td style={{color:'var(--text-muted)'}}>{r[1]}</td>
                  <td style={{color:'var(--amber)'}}>{r[2]}</td>
                  <td style={{color:'var(--green)',fontWeight:700}}>{r[3]}</td>
                  <td style={{color:'var(--green)'}}>{r[4]}</td>
                  <td style={{color:'var(--text-secondary)',fontSize:10}}>{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
