import { useEffect, useRef, useState } from 'react'
import { SIM_DATA } from '../data/simulationData'
import './MapPanel.css'

/* ── helpers ─────────────────────────────────────────────────────── */
function zoneColor(zone, frame, status) {
  if (status === 'idle') return zone.disaster === 'flood' ? '#4d8fff' : '#ff6b1a'
  const tot = zone.crit_init + zone.ser_init + zone.mod_init + zone.disp_init
  const pct = frame ? (frame.sv / tot) * 100 : 0
  if (pct > 85) return '#00e676'
  if (pct > 70) return '#ffb81c'
  if (pct > 50) return '#ff6b1a'
  return '#ff2d2d'
}

// Radius scaled by population (meters)
function zoneRadius(zone) {
  const tot = zone.crit_init + zone.ser_init + zone.mod_init + zone.disp_init
  // Haiti zones are geographically close → tighter radii; Texas zones spread
  return Math.max(800, Math.min(6000, Math.sqrt(tot) * 60))
}

function popupHtml(zone, frame, status) {
  const isDone = status === 'done'
  const isIdle = status === 'idle'

  // Pre-run: show DB resource info
  if (isIdle) {
    const totalBeds = zone.total_beds || zone.hospitals.reduce((a,h)=>a+h.beds,0)
    const clustCount = zone.clusters ? zone.clusters.length : zone.hospitals.length
    const sheltCount = zone.shelter_count || zone.shelters ? zone.shelters.length : 0
    const sheltCap   = zone.shelter_cap || 0
    const dis = zone.disaster
    const disCol = dis==='flood' ? '#4d9fff' : '#ff7a28'
    const disBg  = dis==='flood' ? 'rgba(77,159,255,0.18)' : 'rgba(255,122,40,0.18)'
    return `
    <div style="font-family:'DM Sans',sans-serif;min-width:230px;font-size:12px">
      <div style="font-family:'Rajdhani',sans-serif;font-size:19px;font-weight:900;margin-bottom:8px;display:flex;align-items:center;gap:9px">
        ${zone.name}
        <span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:800;background:${disBg};color:${disCol};border:1px solid ${disCol}55">
          ${dis==='flood'?'🌊 FLOOD':'🌪 WIND'}
        </span>
      </div>
      <div style="color:#8b94b8;font-size:10px;font-weight:700;margin-bottom:10px">${zone.region}</div>
      <div style="font-size:9px;font-family:'IBM Plex Mono';color:#3f4a72;font-weight:800;letter-spacing:0.1em;margin-bottom:6px;text-transform:uppercase">Resource Database</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;font-size:11px;margin-bottom:10px">
        <span style="color:#4a5380;font-weight:700">Population</span><span style="font-weight:800">${(zone.population||0).toLocaleString()}</span>
        <span style="color:#4a5380;font-weight:700">Affected</span><span style="font-weight:800;color:#ffc93d">${(zone.affected||0).toLocaleString()}</span>
        <span style="color:#4a5380;font-weight:700">Clusters</span><span style="font-weight:800">${clustCount}</span>
        <span style="color:#4a5380;font-weight:700">Hospitals</span><span style="font-weight:800">${zone.hospitals.length} · ${totalBeds} beds</span>
        <span style="color:#4a5380;font-weight:700">Shelters</span><span style="font-weight:800;color:#00f0c0">${sheltCount} · ${sheltCap.toLocaleString()} cap</span>
        <span style="color:#4a5380;font-weight:700">Ambulances</span><span style="color:#ff3d3d;font-weight:800">${zone.ambulances}</span>
        <span style="color:#4a5380;font-weight:700">Buses</span><span style="color:#ffc93d;font-weight:800">${zone.buses}</span>
        <span style="color:#4a5380;font-weight:700">Boats</span><span style="color:#4d9fff;font-weight:800">${zone.boats || 0}</span>
      </div>
      <div style="padding:6px 8px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.07);font-size:9px;font-family:'IBM Plex Mono';color:#3f4a72;font-weight:700">
        ⏸ Run allocation to see rescue outcomes
      </div>
    </div>`
  }

  // Running/Done: show rescue outcomes
  const tot    = zone.crit_init + zone.ser_init + zone.mod_init + zone.disp_init
  const finalInj  = zone.crit_saved + zone.ser_saved + zone.mod_saved
  const finalDisp = zone.disp_saved
  const finalSv   = finalInj + finalDisp

  const sv      = isDone ? finalSv   : (frame ? frame.sv   : 0)
  const injSv   = isDone ? finalInj  : (frame ? (frame.cs + frame.ss + frame.ms) : 0)
  const dispSv  = isDone ? finalDisp : (frame ? frame.ds : 0)
  const dead    = isDone ? zone.total_dead : (frame ? frame.dead : 0)
  const bedOcc  = isDone ? Math.max(0,(zone.beds_freed||0)-(zone.total_beds||0)) : (frame ? Math.max(0,(frame.cs||0)+(frame.ss||0)+(frame.ms||0)-((zone.total_beds)||2290)) : 0)
  const bedFreed= isDone ? zone.beds_freed : (frame ? (frame.bed_freed || 0) : 0)
  const sheltOcc= isDone ? zone.shelter_occ_final : (frame ? (frame.shelt_occ || frame.ds || 0) : 0)

  const pct = isDone ? zone.save_pct.toFixed(1) : frame ? ((sv / tot) * 100).toFixed(1) : '—'
  const col = parseFloat(pct) >= 90 ? '#05f585' : parseFloat(pct) >= 80 ? '#ffc93d' : '#ff3d3d'
  const totalBeds = zone.total_beds || zone.hospitals.reduce((a,h)=>a+h.beds,0)
  const sheltCap  = zone.shelter_cap || 0

  return `
    <div style="font-family:'DM Sans',sans-serif;min-width:230px;font-size:12px">
      <div style="font-family:'Rajdhani',sans-serif;font-size:19px;font-weight:900;margin-bottom:8px;display:flex;align-items:center;gap:9px">
        ${zone.name}
        <span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:800;
          background:${zone.disaster==='flood'?'rgba(77,159,255,0.18)':'rgba(255,122,40,0.18)'};
          color:${zone.disaster==='flood'?'#4d9fff':'#ff7a28'};
          border:1px solid ${zone.disaster==='flood'?'rgba(77,159,255,0.4)':'rgba(255,122,40,0.4)'}">
          ${zone.disaster==='flood'?'🌊 FLOOD':'🌪 WIND'}
        </span>
      </div>
      <div style="color:#8b94b8;margin-bottom:10px;font-size:10px;font-weight:700">${zone.region}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;font-size:11px;margin-bottom:10px">
        <span style="color:#4a5380;font-weight:700">Affected</span><span style="font-weight:800">${tot.toLocaleString()}</span>
        <span style="color:#4a5380;font-weight:700">Save Rate</span><span style="color:${col};font-weight:900;font-size:13px">${pct}%</span>
        <span style="color:#4a5380;font-weight:700">Amb Trips</span><span style="color:#ff3d3d;font-weight:800">${zone.amb_trips}</span>
        <span style="color:#4a5380;font-weight:700">Bus/Boat</span><span style="color:#ffc93d;font-weight:800">${zone.bus_trips}/${zone.boat_trips}</span>
        <span style="color:#4a5380;font-weight:700">Bed Turnovers</span><span style="color:#c084ff;font-weight:800">${bedOcc.toLocaleString()}</span>
        <span style="color:#4a5380;font-weight:700">Shelter Occ</span><span style="color:#00f0c0;font-weight:800">${sheltOcc.toLocaleString()}</span>
      </div>
      <div style="margin-top:8px;padding-top:9px;border-top:1px solid rgba(255,255,255,0.08)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;font-size:11px;margin-bottom:8px">
          <span style="color:#05f585;font-weight:800">✅ Saved: ${sv.toLocaleString()}</span>
          <span style="color:#ff3d3d;font-weight:800">💀 Casualties: ${dead}</span>
          <span style="color:#ff7a28;font-weight:800">⚕ Inj saved: ${injSv.toLocaleString()}</span>
          <span style="color:#4d9fff;font-weight:800">🚢 Disp evac: ${dispSv.toLocaleString()}</span>
        </div>
        <div style="height:7px;border-radius:4px;background:rgba(255,255,255,0.07);overflow:hidden">
          <div style="height:100%;border-radius:4px;background:${col};width:${pct}%;transition:width 0.5s ease"></div>
        </div>
        <div style="font-size:9px;color:#4a5380;margin-top:3px;text-align:right;font-weight:800">
          ${pct}% saved${isDone?' · FINAL RESULT':''}
        </div>
      </div>
    </div>`
}

/* ── moving icon creators ───────────────────────────────────────── */
function makeMovingIcon(type) {
  const icons = {
    ambulance: { emoji: '🚑', color: '#ff2d2d', bg: 'rgba(255,45,45,0.15)', glow: 'rgba(255,45,45,0.4)' },
    bus:       { emoji: '🚌', color: '#ffb81c', bg: 'rgba(255,184,28,0.15)', glow: 'rgba(255,184,28,0.4)' },
    boat:      { emoji: '⛵', color: '#4d8fff', bg: 'rgba(77,143,255,0.15)', glow: 'rgba(77,143,255,0.4)' },
  }
  const i = icons[type]
  return `<div style="
    width:26px;height:26px;display:flex;align-items:center;justify-content:center;
    background:${i.bg};border:1px solid ${i.color};border-radius:5px;
    font-size:14px;
    box-shadow:0 0 8px ${i.glow};
    animation:float 1.8s ease-in-out infinite;
  ">${i.emoji}</div>`
}

/* ── Component ───────────────────────────────────────────────────── */
export default function MapPanel({ sim }) {
  const mapRef      = useRef(null)
  const leafRef     = useRef(null)
  const circlesRef  = useRef({})   // zone_id → circle
  const routesRef   = useRef([])   // animated polylines
  const vehiclesRef = useRef([])   // animated vehicle markers
  const clusterRef  = useRef({})   // cluster pulse circles
  const milestoneRef = useRef({})   // last milestone pct per zone
  const rippleRef    = useRef([])   // ripple circles
  const [ready, setReady] = useState(false)
  const [legend, setLegend] = useState(false)

  /* ── init Leaflet ── */
  useEffect(() => {
    if (leafRef.current) return
    import('leaflet').then(m => {
      const L   = m.default
      window._L = L

      // Multi-region: use a world tile with zoom 4 centred between Haiti and Texas
      const map = L.map(mapRef.current, {
        center: [23, -82],
        zoom: 5,
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map)

      leafRef.current = map
      setReady(true)
    })
  }, [])

  /* ── draw static features when map ready ── */
  useEffect(() => {
    if (!ready) return
    const L = window._L
    const map = leafRef.current

    sim.activeData.zones.forEach(zone => {
      const color  = '#ff6b1a'
      const r      = zoneRadius(zone)

      // Zone circle
      const circle = L.circle([zone.lat, zone.lon], {
        radius: r,
        color, fillColor: color,
        fillOpacity: 0.13, weight: 2, opacity: 0.6,
      })
      circle.bindPopup(popupHtml(zone, null, 'idle'), { maxWidth: 280 })
      circle.on('click', () => sim.setSelectedZone(zone.zone_id))
      circle.addTo(map)
      circlesRef.current[zone.zone_id] = circle

      // Cluster pulse dots
      clusterRef.current[zone.zone_id] = zone.clusters.map(cl => {
        const pulse = L.circle([cl.lat, cl.lon], {
          radius: r * 0.18,
          color: '#ff2d2d', fillColor: '#ff2d2d',
          fillOpacity: 0.25, weight: 1, opacity: 0.5,
        }).addTo(map)
        return pulse
      })

      // Zone label
      const icon = L.divIcon({
        html: `<div class="zone-lbl ${zone.disaster}">
          <span>${zone.name}</span>
          <span class="zone-dis-icon">${zone.disaster==='flood'?'🌊':'🌪'}</span>
        </div>`,
        className: '', iconAnchor: [28, 8],
      })
      L.marker([zone.lat, zone.lon], { icon, interactive: false }).addTo(map)
    })

    // Hospitals
    sim.activeData.zones.forEach(zone => {
      zone.hospitals.forEach(h => {
        const icon = L.divIcon({
          html: `<div class="hosp-marker" title="${h.name}"><span>🏥</span></div>`,
          className: '', iconAnchor: [13, 13],
        })
        L.marker([h.lat, h.lon], { icon })
          .bindPopup(`<div style="font-family:'DM Sans',sans-serif;font-size:12px">
            <b>${h.name}</b><br/>
            <span style="color:#8b94b8">Beds: </span><span style="color:#00d4ff">${h.beds}</span>
          </div>`)
          .addTo(map)
      })
    })

    // Shelters
    sim.activeData.zones.forEach(zone => {
      zone.shelters.forEach(s => {
        const icon = L.divIcon({
          html: `<div class="shelter-marker" title="Shelter (cap:${s.cap})">⛺</div>`,
          className: '', iconAnchor: [10, 10],
        })
        L.marker([s.lat, s.lon], { icon, interactive: false }).addTo(map)
      })
    })

    setLegend(true)
  }, [ready])

  /* ── update every step ── */
  useEffect(() => {
    if (!ready) return
    const L   = window._L
    const map = leafRef.current

    // Remove old routes + vehicles + ripples
    routesRef.current.forEach(l => map.removeLayer(l))
    vehiclesRef.current.forEach(m2 => map.removeLayer(m2))
    rippleRef.current.forEach(r => { try { map.removeLayer(r) } catch(e){} })
    routesRef.current   = []
    vehiclesRef.current = []
    rippleRef.current   = []

    sim.activeData.zones.forEach(zone => {
      const circle = circlesRef.current[zone.zone_id]
      if (!circle) return

      const tl    = sim.activeData.timelines[String(zone.zone_id)]
      const frame = tl[Math.min(sim.step, tl.length - 1)]
      const color = zoneColor(zone, frame, sim.status)

      // Update zone circle
      circle.setStyle({
        color, fillColor: color,
        fillOpacity: sim.status === 'running' ? 0.2 : 0.13,
        weight: sim.status === 'running' ? 2.5 : 2,
      })
      circle.setPopupContent(popupHtml(zone, frame, sim.status))

      // Milestone ripple — fire when zone crosses 25/50/75/90%
      const tot2  = zone.crit_init + zone.ser_init + zone.mod_init + zone.disp_init
      const pctNow = frame ? (frame.sv / tot2) * 100 : 0
      const lastPct = milestoneRef.current[zone.zone_id] || 0
      const milestones = [25, 50, 75, 90]
      milestones.forEach(m => {
        if (pctNow >= m && lastPct < m) {
          // Draw expanding ripple ring
          const ripple = L.circle([zone.lat, zone.lon], {
            radius: zoneRadius(zone) * 1.4,
            color, fillColor: color, fillOpacity: 0,
            weight: 3, opacity: 0.7, interactive: false,
            className: 'zone-transition-ring',
          }).addTo(map)
          rippleRef.current.push(ripple)
          setTimeout(() => { try { map.removeLayer(ripple) } catch(e){} }, 2000)
        }
      })
      milestoneRef.current[zone.zone_id] = pctNow

      // Update cluster pulses based on alive count
      const cls = clusterRef.current[zone.zone_id] || []
      cls.forEach((p, i) => {
        const cl = zone.clusters[i]
        if (!cl) return
        const frac = frame.ca / Math.max(1, zone.crit_init)
        const clrPulse = frac > 0.5 ? '#ff2d2d' : frac > 0.2 ? '#ff6b1a' : '#00e676'
        p.setStyle({ color: clrPulse, fillColor: clrPulse, fillOpacity: sim.status==='running'?0.35:0.2 })
      })

      if (sim.status !== 'running' && sim.status !== 'paused') return

      const nearestHosp = zone.hospitals[0]
      const nearestShlt = zone.shelters[0]

      // ── Ambulance routes (cluster → hospital) ──
      if (frame.amb > 0 && nearestHosp) {
        zone.clusters.forEach((cl, i) => {
          const ambPerCluster = Math.ceil(frame.amb / zone.clusters.length)
          if (ambPerCluster <= 0) return

          // Dashed red polyline
          const route = L.polyline(
            [[cl.lat, cl.lon], [nearestHosp.lat, nearestHosp.lon]],
            { color: '#ff2d2d', weight: 2, opacity: 0.6, dashArray: '5,8', className: 'amb-route' }
          ).addTo(map)
          routesRef.current.push(route)

          // Moving ambulance marker along the route (1 per active)
          const progress = (sim.step % 12) / 12
          const midLat = cl.lat + (nearestHosp.lat - cl.lat) * progress
          const midLon = cl.lon + (nearestHosp.lon - cl.lon) * progress
          const vicon = L.divIcon({ html: makeMovingIcon('ambulance'), className: '', iconAnchor: [13, 13] })
          const vm = L.marker([midLat, midLon], { icon: vicon, interactive: false }).addTo(map)
          vehiclesRef.current.push(vm)
        })
      }

      // ── Bus routes (cluster → shelter) ──
      if (frame.bus > 0 && nearestShlt) {
        zone.clusters.forEach((cl, i) => {
          const route = L.polyline(
            [[cl.lat, cl.lon], [nearestShlt.lat, nearestShlt.lon]],
            { color: '#ffb81c', weight: 1.8, opacity: 0.55, dashArray: '4,10', className: 'bus-route' }
          ).addTo(map)
          routesRef.current.push(route)

          const progress = ((sim.step + 6) % 12) / 12
          const midLat = cl.lat + (nearestShlt.lat - cl.lat) * progress
          const midLon = cl.lon + (nearestShlt.lon - cl.lon) * progress
          const vicon = L.divIcon({ html: makeMovingIcon('bus'), className: '', iconAnchor: [13, 13] })
          vehiclesRef.current.push(L.marker([midLat, midLon], { icon: vicon, interactive: false }).addTo(map))
        })
      }

      // ── Boat routes (flood zones only) ──
      if (frame.boat > 0 && zone.disaster === 'flood' && nearestShlt) {
        zone.clusters.forEach((cl, i) => {
          const route = L.polyline(
            [[cl.lat, cl.lon], [nearestShlt.lat, nearestShlt.lon]],
            { color: '#4d8fff', weight: 2, opacity: 0.6, dashArray: '2,6', className: 'boat-route' }
          ).addTo(map)
          routesRef.current.push(route)

          const progress = ((sim.step + 3) % 8) / 8
          const midLat = cl.lat + (nearestShlt.lat - cl.lat) * progress
          const midLon = cl.lon + (nearestShlt.lon - cl.lon) * progress
          const vicon = L.divIcon({ html: makeMovingIcon('boat'), className: '', iconAnchor: [13, 13] })
          vehiclesRef.current.push(L.marker([midLat, midLon], { icon: vicon, interactive: false }).addTo(map))
        })
      }

      // ── Hospital fill indicator ──
      if (nearestHosp && frame.bu > 0) {
        const fillRatio = frame.bu / Math.max(1, zone.hospitals.reduce((a,h)=>a+h.beds,0))
        const hColor    = fillRatio > 0.9 ? '#ff2d2d' : fillRatio > 0.6 ? '#ffb81c' : '#00e676'
        const hCircle   = L.circle([nearestHosp.lat, nearestHosp.lon], {
          radius: zoneRadius(zone) * 0.10,
          color: hColor, fillColor: hColor, fillOpacity: 0.35, weight: 1.5,
          interactive: false,
        }).addTo(map)
        routesRef.current.push(hCircle)
      }
    })
  }, [sim.step, sim.status, ready])

  return (
    <div className="map-panel card">
      <div className="card-hd">
        <span className="card-title">🗺 Operational Map — Haiti · Houston · Panama City</span>
        <div style={{display:'flex',gap:7}}>
          {sim.status==='running' && <span className="chip chip-red" style={{animation:'blink 1s infinite'}}>● LIVE</span>}
          <span className="chip chip-cyan">{sim.activeData.zones.length} Zone(s) · {sim.activeData.zones.reduce((a,z)=>a+z.hospitals.length,0)} Hospital(s)</span>
          <span className="chip chip-amber">{sim.status!=='idle'?`Step ${sim.step}/95`:'PPO v9'}</span>
        </div>
      </div>
      <div className="map-wrap">
        <div ref={mapRef} className="lmap" />

        {/* Legend */}
        {legend && (
          <div className="map-legend">
            <div className="leg-title">Save Rate</div>
            {[['#00e676','>85%'],['#ffb81c','70–85%'],['#ff6b1a','50–70%'],['#ff2d2d','<50%']].map(([c,l])=>(
              <div key={l} className="leg-row"><span className="leg-dot" style={{background:c}}/><span>{l}</span></div>
            ))}
            <div style={{marginTop:7,borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:6}}>
              <div className="leg-row"><span>🏥</span><span>Hospital</span></div>
              <div className="leg-row"><span>⛺</span><span>Shelter</span></div>
              <div className="leg-row"><span style={{color:'#ff2d2d'}}>- -</span><span>Amb route</span></div>
              <div className="leg-row"><span style={{color:'#ffb81c'}}>- -</span><span>Bus route</span></div>
              <div className="leg-row"><span style={{color:'#4d8fff'}}>- -</span><span>Boat route</span></div>
            </div>
            <div style={{marginTop:7,borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:6}}>
              <div className="leg-row"><span>🚑</span><span>Moving amb</span></div>
              <div className="leg-row"><span>🚌</span><span>Moving bus</span></div>
              <div className="leg-row"><span>⛵</span><span>Moving boat</span></div>
            </div>
          </div>
        )}

        {/* Idle overlay */}
        {sim.status === 'idle' && (
          <div className="map-idle">
            <div className="idle-hex">⬡</div>
            <div className="idle-msg">Click <strong>RUN ALLOCATION</strong> to deploy PPO agent</div>
            <div className="idle-sub">{sim.mode==='zone'&&sim.zoneId ? `Zone ${sim.zoneId} selected — Single-zone PPO run` : 'Zones: Haiti (4,12,14,26) · Houston TX (13,19,28) · Panama City FL (2)'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
