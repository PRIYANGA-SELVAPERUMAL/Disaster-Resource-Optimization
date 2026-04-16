import { useState, useRef, useCallback, useEffect } from 'react'
import { SIM_DATA } from '../data/simulationData'

export function useSimulation() {
  const [status,       setStatus]       = useState('idle')
  const [step,         setStep]         = useState(0)
  const [speed,        setSpeedState]   = useState(1)
  const [alerts,       setAlerts]       = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [mode,         setMode]         = useState('all')
  const [zoneId,       setZoneId]       = useState(null)

  const timerRef   = useRef(null)
  const stepRef    = useRef(0)
  const speedRef   = useRef(1)
  const alertIdRef = useRef(0)
  const statusRef  = useRef('idle')

  const getData = useCallback(() => {
    if (mode === 'zone' && zoneId && SIM_DATA.zone_modes?.[zoneId]) {
      return SIM_DATA.zone_modes[zoneId]
    }
    return SIM_DATA
  }, [mode, zoneId])

  const N_STEPS = 96

  const addAlert = useCallback((msg, type = 'warn') => {
    const id = ++alertIdRef.current
    setAlerts(prev => [{ id, msg, type, ts: Date.now() }, ...prev.slice(0, 9)])
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 7500)
  }, [])

  const getStepData = useCallback((s) => {
    const src = getData()
    let totalSaved=0, totalDead=0, totalCrit=0, totalDisp=0
    let injSaved=0, dispSaved=0
    let ambActive=0, busActive=0, boatActive=0
    const zoneStates = {}

    src.zones.forEach(z => {
      const tl    = src.timelines[String(z.zone_id)]
      const idx   = Math.min(s, tl.length - 1)
      const frame = tl[idx]
      totalSaved += frame.sv
      totalDead  += frame.dead
      totalCrit  += frame.ca
      totalDisp  += frame.da
      injSaved   += frame.cs + frame.ss + frame.ms
      dispSaved  += frame.ds
      ambActive  += frame.amb
      busActive  += frame.bus
      boatActive += frame.boat
      zoneStates[z.zone_id] = { ...frame, zone: z }
    })

    const totalAffected = src.zones.reduce((a,z)=>a+z.affected, 0)
    const totalInjInit  = src.zones.reduce((a,z)=>a+z.crit_init+z.ser_init+z.mod_init, 0)

    return {
      totalSaved, totalDead, totalCrit, totalDisp,
      injSaved, dispSaved, totalInjInit, totalAffected,
      ambActive, busActive, boatActive,
      zoneStates,
    }
  }, [getData])

  const fireAlerts = useCallback((s, isZoneMode) => {
    const MAP_ALL = {
      3:  ['🚨 Mass casualty protocol — all 8 zones mobilised', 'critical'],
      8:  ['🚑 Full ambulance fleet deployed across all zones', 'warn'],
      15: ['🏥 Zone 12 hospitals at high load — PPO rerouting', 'warn'],
      20: ['🌊 959 boat trips launched — Flood Zones 13, 28, 19', 'info'],
      28: ['⚕ Critical surge Zone 2 — PPO triage prioritising', 'warn'],
      35: ['📊 Mid-point: ~50% of 49,827 population secured', 'info'],
      48: ['🚌 Bus convoy wave 2 — 371 total trips underway', 'info'],
      58: ['✅ Zone 4 cleared — 90.2% save rate', 'success'],
      65: ['🏥 Bed turnover cycling — capacity regenerating', 'info'],
      72: ['⛵ Flood zone boat ops complete — 959 trips done', 'success'],
      82: ['✅ Zone 26 cleared — 90.4% save rate', 'success'],
      88: ['📈 Final phase — PPO maximising remaining rescues', 'info'],
    }
    const MAP_ZONE = {
      5:  ['🚨 Zone protocol active — all resources mobilised', 'critical'],
      12: ['🚑 Ambulance fleet at peak capacity', 'warn'],
      24: ['📊 Quarter mark — critical patients prioritised', 'info'],
      48: ['🚌 Displaced evacuation convoy wave 2', 'info'],
      60: ['🏥 Bed turnover freeing capacity', 'info'],
      80: ['📈 Final phase — residual rescues underway', 'info'],
      90: ['✅ Zone allocation near completion', 'success'],
    }
    const MAP = isZoneMode ? MAP_ZONE : MAP_ALL
    if (MAP[s]) addAlert(...MAP[s])
  }, [addAlert])

  const tick = useCallback(() => {
    const next = stepRef.current + 1
    const isZone = mode === 'zone'
    if (next >= N_STEPS) {
      stepRef.current = N_STEPS - 1
      setStep(N_STEPS - 1)
      statusRef.current = 'done'
      setStatus('done')
      clearInterval(timerRef.current)
      const src = isZone && zoneId ? SIM_DATA.zone_modes[zoneId] : SIM_DATA
      const pct = src.summary.overall_pct ?? 92.1
      addAlert(`✅ ${isZone ? `Zone ${zoneId}` : 'Full'} simulation complete — ${pct}% save rate`, 'success')
      return
    }
    stepRef.current = next
    setStep(next)
    fireAlerts(next, isZone)
  }, [N_STEPS, addAlert, fireAlerts, mode, zoneId])

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current)
    const interval = Math.max(40, Math.round(200 / speedRef.current))
    timerRef.current = setInterval(tick, interval)
  }, [tick])

  const start = useCallback(() => {
    if (statusRef.current === 'done') {
      stepRef.current = 0; setStep(0); setAlerts([])
    }
    statusRef.current = 'running'
    setStatus('running')
    const label = mode === 'zone' ? `Zone ${zoneId}` : '8-Zone'
    addAlert(`🚨 PPO v9 ${label} Simulation Started`, 'critical')
    startTimer()
  }, [addAlert, startTimer, mode, zoneId])

  const pause  = useCallback(() => { statusRef.current='paused'; setStatus('paused'); clearInterval(timerRef.current) }, [])
  const resume = useCallback(() => { statusRef.current='running'; setStatus('running'); startTimer() }, [startTimer])
  const reset  = useCallback(() => {
    clearInterval(timerRef.current)
    stepRef.current=0; statusRef.current='idle'
    setStep(0); setStatus('idle'); setAlerts([]); setSelectedZone(null)
  }, [])
  const setSpeed = useCallback((s) => {
    speedRef.current=s; setSpeedState(s)
    if (statusRef.current==='running') startTimer()
  }, [startTimer])

  const switchToAll = useCallback(() => { reset(); setMode('all'); setZoneId(null) }, [reset])
  const switchToZone = useCallback((zid) => { reset(); setMode('zone'); setZoneId(zid) }, [reset])

  useEffect(() => () => clearInterval(timerRef.current), [])

  return {
    status, step, speed, alerts, selectedZone, setSelectedZone,
    mode, zoneId, switchToAll, switchToZone,
    N_STEPS, currentData: getStepData(step),
    activeData: getData(),
    start, pause, resume, reset, setSpeed, getStepData,
  }
}
