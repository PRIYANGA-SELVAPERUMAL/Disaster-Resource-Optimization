import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell
} from 'recharts'
import { SIM_DATA } from '../data/simulationData'
import './ChartsPage.css'

const ZONE_COLORS = ['#ff2d2d','#ff6b1a','#ffb81c','#00e676','#00d4ff','#4d8fff','#7c6fff','#ff69b4']

const TT = ({ active, payload, label, labelFmt }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{background:'rgba(8,11,24,0.97)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:7,padding:'9px 13px',
      fontSize:10,fontFamily:'IBM Plex Mono',color:'#eef1ff',backdropFilter:'blur(8px)'}}>
      <div style={{color:'#434d6e',marginBottom:5,fontSize:9}}>{labelFmt ? labelFmt(label) : label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color,marginBottom:2}}>{p.name}: <b>{typeof p.value==='number'?p.value.toLocaleString():p.value}</b></div>
      ))}
    </div>
  )
}

const AX = { tick:{fill:'#434d6e',fontSize:8,fontFamily:'IBM Plex Mono'}, axisLine:{stroke:'rgba(255,255,255,0.05)'}, tickLine:false }
const stepFmt = v => `T${v}`

function buildGlobal(step, src) {
  const r = []
  const totalAff = src.zones.reduce((a,z)=>a+z.affected, 0)
  for (let t=0; t<=Math.min(step,95); t++) {
    let sv=0,dead=0,ca=0,amb=0,bus=0,boat=0,injSv=0,dispSv=0
    src.zones.forEach(z => {
      const f = src.timelines[String(z.zone_id)][t]
      sv+=f.sv; dead+=f.dead; ca+=f.ca; amb+=f.amb; bus+=f.bus; boat+=f.boat
      injSv += f.cs+f.ss+f.ms; dispSv += f.ds
    })
    r.push({t, saved:sv, dead, crit:ca, amb, bus, boat,
      injSaved:injSv, dispSaved:dispSv,
      savePct:+((sv/totalAff)*100).toFixed(1)})
  }
  return r
}

function buildZoneTrend(step, src) {
  const r=[]
  for (let t=0;t<=Math.min(step,95);t+=2) {
    const row={t}
    src.zones.forEach(z=>{
      const f=src.timelines[String(z.zone_id)][t]
      const tot=z.crit_init+z.ser_init+z.mod_init+z.disp_init
      row[z.name]=+((f.sv/tot)*100).toFixed(1)
    })
    r.push(row)
  }
  return r
}

function buildInjTrend(step, src) {
  const r=[]
  for (let t=0;t<=Math.min(step,95);t+=2) {
    let ca=0,sa=0,ma=0,cs=0,ss=0,ms=0
    src.zones.forEach(z=>{
      const f=src.timelines[String(z.zone_id)][t]
      ca+=f.ca; sa+=f.sa; ma+=f.ma; cs+=f.cs; ss+=f.ss; ms+=f.ms
    })
    r.push({t,critAlive:ca,serAlive:sa,modAlive:ma,critSaved:cs,serSaved:ss,modSaved:ms})
  }
  return r
}

function buildComp(src) {
  const c = src.comparison
  return c.methods.map((m,i)=>({
    name: m,
    'Overall': c.overall[i],
    'Injured': c.injured[i] ? +c.injured[i].toFixed(1) : 0,
    'Displaced': c.displaced[i] ? +c.displaced[i].toFixed(1) : 0,
  }))
}

function buildFinal(step, src) {
  return src.zones.map(z=>{
    const f=src.timelines[String(z.zone_id)][Math.min(step,95)]
    const tot=z.crit_init+z.ser_init+z.mod_init+z.disp_init
    return {name:z.name,'Crit':f.cs,'Ser':f.ss,'Mod':f.ms,'Disp':f.ds,'Dead':f.dead,
      'Save%':+((f.sv/tot)*100).toFixed(1)}
  })
}

function buildMortality(src) {
  // Mortality % = total_dead / affected * 100 (matches report)
  return src.zones.map(z=>({
    name: z.name,
    'Mortality %': +(z.total_dead / z.affected * 100).toFixed(1),
  }))
}

function buildRadar(src) {
  return src.zones.map(z=>{
    const inj=z.crit_init+z.ser_init+z.mod_init
    const injSv=z.crit_saved+z.ser_saved+z.mod_saved
    return {
      zone: z.name,
      'Save%': +z.save_pct.toFixed(0),
      'CritSave%': +(z.crit_saved/z.crit_init*100).toFixed(0),
      'InjSave%': +(injSv/inj*100).toFixed(0),
    }
  })
}

function ChartCard({ title, sub, children, note }) {
  return (
    <div className="cc card">
      <div className="card-hd"><span className="card-title">{title}</span>{sub&&<span className="chip chip-cyan">{sub}</span>}</div>
      <div className="cc-body">{children}</div>
      {note && <div className="cc-note">{note}</div>}
    </div>
  )
}

function AnalyticsStat({ label, value, unit, color }) {
  return (
    <div className="an-stat" style={{borderColor:`${color}22`,background:`${color}08`}}>
      <div className="an-val" style={{color}}>{value}<span className="an-unit">{unit}</span></div>
      <div className="an-lbl">{label}</div>
    </div>
  )
}

export default function ChartsPage({ sim }) {
  const step = sim.status==='idle' ? 95 : sim.step
  const src  = sim.activeData
  const s    = src.summary

  const gl  = buildGlobal(step, src)
  const zt  = buildZoneTrend(step, src)
  const it  = buildInjTrend(step, src)
  const cp  = buildComp(src)
  const fn  = buildFinal(step, src)
  const mt  = buildMortality(src)
  const zr  = buildRadar(src)

  const last = gl[gl.length-1]
  const isZone = sim.mode === 'zone'
  const greedyPct = src.comparison.overall[0] ?? 85.8

  return (
    <div className="charts-page">

      {/* ── Summary stats strip ── */}
      <div className="an-stats-row">
        <AnalyticsStat label="Overall Save Rate"   value={`${s.overall_pct}`}  unit="%" color="#00e676"/>
        <AnalyticsStat label="Total Saved"         value={s.total_saved.toLocaleString()} unit="" color="#00d4ff"/>
        <AnalyticsStat label="Injured Saved"       value={s.injured_saved.toLocaleString()} unit="" color="#ff6b1a"/>
        <AnalyticsStat label="Critical Saved"      value={s.critical_saved.toLocaleString()} unit="" color="#ff2d2d"/>
        <AnalyticsStat label="Displaced Evacuated" value={s.displaced_saved.toLocaleString()} unit="" color="#4d8fff"/>
        <AnalyticsStat label="Total Casualties"    value={s.total_dead.toLocaleString()} unit="" color="#8b94b8"/>
        <AnalyticsStat label="vs Greedy"           value={`+${(s.overall_pct - greedyPct).toFixed(1)}`} unit="pp" color="#00e676"/>
        <AnalyticsStat label="Timesteps"           value="96" unit=" steps" color="#ffb81c"/>
      </div>

      {/* Row 1 — Cumulative saves + Injury severity */}
      <div className="cc-row">
        <ChartCard title="📈 Cumulative Saves Over Time" sub={`${last?.savePct??0}% final`}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={gl} margin={{top:8,right:16,bottom:0,left:0}}>
              <defs>
                <linearGradient id="gSv"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00e676" stopOpacity={0.3}/><stop offset="95%" stopColor="#00e676" stopOpacity={0}/></linearGradient>
                <linearGradient id="gInj" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff6b1a" stopOpacity={0.28}/><stop offset="95%" stopColor="#ff6b1a" stopOpacity={0}/></linearGradient>
                <linearGradient id="gDsp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4d8fff" stopOpacity={0.2}/><stop offset="95%" stopColor="#4d8fff" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="t" {...AX} tickFormatter={stepFmt} label={{value:'Timestep',position:'insideBottomRight',offset:-4,fill:'#434d6e',fontSize:8}}/>
              <YAxis {...AX}/>
              <Tooltip content={<TT labelFmt={v=>`Step ${v}`}/>}/>
              <Legend wrapperStyle={{fontSize:9,fontFamily:'IBM Plex Mono'}}/>
              <ReferenceLine y={s.total_saved} stroke="rgba(0,230,118,0.2)" strokeDasharray="4 4"/>
              <Area type="monotone" dataKey="saved"     name="Total Saved"    stroke="#00e676" fill="url(#gSv)"  strokeWidth={2}   dot={false}/>
              <Area type="monotone" dataKey="injSaved"  name="Injured Saved"  stroke="#ff6b1a" fill="url(#gInj)" strokeWidth={1.5} dot={false}/>
              <Area type="monotone" dataKey="dispSaved" name="Disp Evacuated" stroke="#4d8fff" fill="url(#gDsp)" strokeWidth={1.5} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="⚕ Injury Severity Saved — Cumulative">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={it} margin={{top:8,right:16,bottom:0,left:0}}>
              <defs>
                <linearGradient id="gCs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff2d2d" stopOpacity={0.3}/><stop offset="95%" stopColor="#ff2d2d" stopOpacity={0}/></linearGradient>
                <linearGradient id="gSs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff6b1a" stopOpacity={0.25}/><stop offset="95%" stopColor="#ff6b1a" stopOpacity={0}/></linearGradient>
                <linearGradient id="gMs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffb81c" stopOpacity={0.22}/><stop offset="95%" stopColor="#ffb81c" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="t" {...AX} tickFormatter={stepFmt}/>
              <YAxis {...AX}/>
              <Tooltip content={<TT labelFmt={v=>`Step ${v}`}/>}/>
              <Legend wrapperStyle={{fontSize:9,fontFamily:'IBM Plex Mono'}}/>
              <Area type="monotone" dataKey="critSaved" name="Critical" stroke="#ff2d2d" fill="url(#gCs)" strokeWidth={2}   dot={false}/>
              <Area type="monotone" dataKey="serSaved"  name="Serious"  stroke="#ff6b1a" fill="url(#gSs)" strokeWidth={1.5} dot={false}/>
              <Area type="monotone" dataKey="modSaved"  name="Moderate" stroke="#ffb81c" fill="url(#gMs)" strokeWidth={1.5} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2 — Per-zone trend + Fleet */}
      <div className="cc-row">
        <ChartCard title="🗺 Per-Zone Save Rate Over Time">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={zt} margin={{top:8,right:16,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="t" {...AX} tickFormatter={stepFmt}/>
              <YAxis domain={[0,100]} {...AX} tickFormatter={v=>v+'%'}/>
              <Tooltip content={<TT labelFmt={v=>`Step ${v}`}/>}/>
              <Legend wrapperStyle={{fontSize:8,fontFamily:'IBM Plex Mono'}}/>
              {src.zones.map((z,i)=>(
                <Line key={z.zone_id} type="monotone" dataKey={z.name} stroke={ZONE_COLORS[i]} dot={false} strokeWidth={1.5}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="🚑 Fleet Deployment Over Timesteps"
          note="Active vehicle count per timestep (1 step = 45 min). Peak T30–T50 = main rescue wave.">
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={gl} margin={{top:8,right:16,bottom:0,left:0}}>
              <defs>
                <linearGradient id="gAmb" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff2d2d" stopOpacity={0.35}/><stop offset="95%" stopColor="#ff2d2d" stopOpacity={0}/></linearGradient>
                <linearGradient id="gBus" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffb81c" stopOpacity={0.28}/><stop offset="95%" stopColor="#ffb81c" stopOpacity={0}/></linearGradient>
                <linearGradient id="gBt"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4d8fff" stopOpacity={0.28}/><stop offset="95%" stopColor="#4d8fff" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="t" {...AX} tickFormatter={stepFmt}/>
              <YAxis {...AX}/>
              <Tooltip content={<TT labelFmt={v=>`Step ${v}`}/>}/>
              <Legend wrapperStyle={{fontSize:9,fontFamily:'IBM Plex Mono'}}/>
              <Area type="monotone" dataKey="amb"  name="Ambulances" stroke="#ff2d2d" fill="url(#gAmb)" strokeWidth={2}   dot={false}/>
              <Area type="monotone" dataKey="bus"  name="Buses"      stroke="#ffb81c" fill="url(#gBus)" strokeWidth={1.5} dot={false}/>
              <Area type="monotone" dataKey="boat" name="Boats"      stroke="#4d8fff" fill="url(#gBt)"  strokeWidth={1.5} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3 — Comparison + Zone final state */}
      <div className="cc-row">
        <ChartCard
          title={`📊 PPO vs DQN vs Greedy — ${isZone ? `Zone ${sim.zoneId}` : 'All Zones'}`}
          sub={`+${(s.overall_pct - greedyPct).toFixed(1)}pp over Greedy`}
        >
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={cp} margin={{top:8,right:16,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="name" {...AX}/>
              <YAxis domain={[0,105]} {...AX} tickFormatter={v=>v+'%'}/>
              <Tooltip content={<TT/>}/>
              <Legend wrapperStyle={{fontSize:9,fontFamily:'IBM Plex Mono'}}/>
              <Bar dataKey="Overall"   fill="#00e676" fillOpacity={0.85} radius={[4,4,0,0]}/>
              <Bar dataKey="Injured"   fill="#ff6b1a" fillOpacity={0.85} radius={[4,4,0,0]}/>
              <Bar dataKey="Displaced" fill="#4d8fff" fillOpacity={0.85} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="⚕ Zone Final State — Saved by Severity">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fn} margin={{top:8,right:16,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="name" {...AX}/>
              <YAxis {...AX} tickFormatter={v=>v>999?(v/1000).toFixed(1)+'k':v}/>
              <Tooltip content={<TT/>}/>
              <Legend wrapperStyle={{fontSize:9,fontFamily:'IBM Plex Mono'}}/>
              <Bar dataKey="Crit" fill="#ff2d2d" fillOpacity={0.85} stackId="s"/>
              <Bar dataKey="Ser"  fill="#ff6b1a" fillOpacity={0.85} stackId="s"/>
              <Bar dataKey="Mod"  fill="#ffb81c" fillOpacity={0.85} stackId="s"/>
              <Bar dataKey="Disp" fill="#4d8fff" fillOpacity={0.85} stackId="s" radius={[4,4,0,0]}/>
              <Bar dataKey="Dead" fill="#8b94b8" fillOpacity={0.6}  stackId="d" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 4 — Mortality + Radar */}
      <div className="cc-row">
        <ChartCard title="💀 Zone Mortality Rate (% of total affected)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mt} margin={{top:8,right:16,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="name" {...AX}/>
              <YAxis {...AX} tickFormatter={v=>v+'%'}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="Mortality %" radius={[4,4,0,0]}>
                {mt.map((entry,i)=>(
                  <Cell key={i} fill={entry['Mortality %']>8?'#ff2d2d':entry['Mortality %']>6?'#ff6b1a':'#ffb81c'} fillOpacity={0.85}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {src.zones.length > 1 && (
          <ChartCard title="📡 Zone Performance Radar — Save% vs Critical Save%">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={zr}>
                <PolarGrid stroke="rgba(255,255,255,0.08)"/>
                <PolarAngleAxis dataKey="zone" tick={{fill:'#434d6e',fontSize:8,fontFamily:'IBM Plex Mono'}}/>
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fill:'#434d6e',fontSize:7}} tickCount={4}/>
                <Radar name="Save%" dataKey="Save%" stroke="#00e676" fill="#00e676" fillOpacity={0.18} strokeWidth={1.5}/>
                <Radar name="Crit Save%" dataKey="CritSave%" stroke="#ff2d2d" fill="#ff2d2d" fillOpacity={0.1} strokeWidth={1.5}/>
                <Legend wrapperStyle={{fontSize:9,fontFamily:'IBM Plex Mono'}}/>
                <Tooltip content={<TT/>}/>
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {src.zones.length === 1 && <div/>}
      </div>

    </div>
  )
}
