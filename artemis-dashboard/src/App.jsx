import { useState } from 'react'
import { useSimulation } from './hooks/useSimulation'
import Header      from './components/Header'
import MetricsBar  from './components/MetricsBar'
import MapPanel    from './components/MapPanel'
import SidePanel   from './components/SidePanel'
import ChartsPage  from './components/ChartsPage'
import StoryPage   from './components/StoryPage'
import './App.css'

export default function App() {
  const sim    = useSimulation()
  const [tab,   setTab]   = useState('live')
  const [theme, setTheme] = useState('dark')  // 'dark' | 'light'

  return (
    <div className={`app theme-${theme}`}>
      <div className="scan-overlay" />
      <Header sim={sim} tab={tab} setTab={setTab} theme={theme} setTheme={setTheme}/>
      {tab === 'live' && (
        <>
          <MetricsBar sim={sim} />
          <div className="workspace">
            <div className="map-col">
              <MapPanel sim={sim} />
            </div>
            <SidePanel sim={sim} />
          </div>
        </>
      )}
      {tab === 'charts' && <ChartsPage sim={sim} />}
      {tab === 'story'  && <StoryPage  sim={sim} />}
    </div>
  )
}
