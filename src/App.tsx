import { useEffect, useState } from 'react'
import ScenarioIntro from './components/ScenarioIntro'
import FlowDiagram from './components/FlowDiagram'
import AgentChatPanel from './components/AgentChatPanel'
import StepNarration from './components/StepNarration'
import NetworkPanel from './components/NetworkPanel'
import JwtViewer from './components/JwtViewer'
import Timeline from './components/Timeline'
import SpecCompare from './components/SpecCompare'
import { STEPS, TOOLS } from './data/scenario'

type Tab = 'network' | 'token'

export default function App() {
  const [screen, setScreen] = useState<'intro' | 'demo'>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(3200)
  const [specOpen, setSpecOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('network')

  const step = STEPS[currentIndex]
  const tool = TOOLS[step.phase]

  useEffect(() => {
    if (!playing) return
    if (currentIndex >= STEPS.length - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setCurrentIndex((i) => Math.min(STEPS.length - 1, i + 1)), speed)
    return () => clearTimeout(t)
  }, [playing, speed, currentIndex])

  useEffect(() => {
    if (!step.token && tab === 'token') setTab('network')
  }, [step, tab])

  useEffect(() => {
    if (screen !== 'demo') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(STEPS.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(0, i - 1))
      if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen])

  if (screen === 'intro') {
    return <ScenarioIntro onStart={() => setScreen('demo')} />
  }

  const reset = () => {
    setCurrentIndex(0)
    setPlaying(false)
  }

  const togglePlay = () => {
    if (currentIndex >= STEPS.length - 1) {
      setCurrentIndex(0)
      setPlaying(true)
    } else {
      setPlaying((p) => !p)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <span className="app-header-dot" />
          Identity Chaining, Live
        </div>
        <div className="app-header-actions">
          <button className="header-btn" onClick={() => setSpecOpen(true)} type="button">
            Compare to spec
          </button>
          <a
            className="header-btn"
            href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/"
            target="_blank"
            rel="noreferrer"
          >
            View draft ↗
          </a>
        </div>
      </header>

      <FlowDiagram step={step} tool={tool} />

      <Timeline
        currentIndex={currentIndex}
        playing={playing}
        speed={speed}
        onSetIndex={(i) => {
          setCurrentIndex(i)
          setPlaying(false)
        }}
        onTogglePlay={togglePlay}
        onSetSpeed={setSpeed}
        onReset={reset}
      />

      <main className="app-main">
        <AgentChatPanel currentIndex={currentIndex} />

        <div className="detail-panel">
          <StepNarration step={step} tool={tool} />
          <div className="detail-tabs">
            <button className={`detail-tab${tab === 'network' ? ' detail-tab-active' : ''}`} onClick={() => setTab('network')} type="button">
              Network
            </button>
            <button
              className={`detail-tab${tab === 'token' ? ' detail-tab-active' : ''}`}
              onClick={() => setTab('token')}
              disabled={!step.token}
              type="button"
            >
              Decoded token
            </button>
          </div>
          <div className="detail-body">
            {tab === 'network' && <NetworkPanel step={step} />}
            {tab === 'token' && step.token && <JwtViewer label={step.token.label} value={step.token.value} />}
          </div>
        </div>
      </main>

      <SpecCompare open={specOpen} step={step} onClose={() => setSpecOpen(false)} />
    </div>
  )
}
