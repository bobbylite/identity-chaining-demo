import { useCallback, useEffect, useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import Hero from './components/Hero'
import Contrasts from './components/Contrasts'
import Walkthrough from './components/Walkthrough'
import LabPanel from './components/LabPanel'
import Pillars from './components/Pillars'
import Faq from './components/Faq'
import Footer from './components/Footer'
import { useTheme } from './lib/useTheme'
import { buildRun, DEFAULT_POLICY, type Condition, type Policy, type Profile } from './data/protocol'
import type { AppId } from './data/world'

export default function App() {
  const { choice, setTheme } = useTheme()

  const [appId, setAppId] = useState<AppId>('crm')
  const [profile, setProfile] = useState<Profile>('xaa')
  const [condition, setCondition] = useState<Condition>('none')
  const [policy, setPolicy] = useState<Policy>(DEFAULT_POLICY)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(2600)

  const run = useMemo(
    () => buildRun(appId, profile, condition, policy),
    [appId, profile, condition, policy],
  )

  // Any change to what we're simulating restarts the walkthrough at step 1.
  useEffect(() => {
    setIndex(0)
    setPlaying(false)
  }, [appId, profile, condition, policy])

  useEffect(() => {
    if (!playing) return
    if (index >= run.steps.length - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setIndex((i) => Math.min(run.steps.length - 1, i + 1)), speed)
    return () => clearTimeout(t)
  }, [playing, index, speed, run.steps.length])

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p && index >= run.steps.length - 1) setIndex(0)
      return !p
    })
  }, [index, run.steps.length])

  // Keyboard scrubbing, but never while the user is inside a form control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight') {
        setIndex((i) => Math.min(run.steps.length - 1, i + 1))
        setPlaying(false)
      } else if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.max(0, i - 1))
        setPlaying(false)
      } else if (e.key === ' ' && !(el instanceof HTMLButtonElement)) {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run.steps.length, togglePlay])

  const pickApp = useCallback((id: AppId) => {
    setAppId(id)
    document.getElementById('walkthrough')?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <>
      <TopBar profile={profile} onProfile={setProfile} theme={choice} onTheme={setTheme} />
      <main>
        <Hero profile={profile} onPick={pickApp} />
        <Contrasts />
        <Walkthrough
          run={run}
          appId={appId}
          onApp={setAppId}
          profile={profile}
          onProfile={setProfile}
          condition={condition}
          onCondition={setCondition}
          policy={policy}
          onPolicy={(id, allowed) => setPolicy((p) => ({ ...p, [id]: allowed }))}
          index={index}
          onIndex={(i) => {
            setIndex(i)
            setPlaying(false)
          }}
          playing={playing}
          onPlay={togglePlay}
          speed={speed}
          onSpeed={setSpeed}
        />
        <LabPanel condition={condition} onCondition={setCondition} run={run} />
        <Pillars profile={profile} />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
