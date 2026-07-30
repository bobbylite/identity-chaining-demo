import { STEPS, TOOLS } from '../data/scenario'

interface Props {
  currentIndex: number
  playing: boolean
  speed: number
  onSetIndex: (i: number) => void
  onTogglePlay: () => void
  onSetSpeed: (ms: number) => void
  onReset: () => void
}

const SPEEDS: [number, string][] = [
  [5000, '0.75×'],
  [3200, '1×'],
  [1800, '1.75×'],
  [900, '3×'],
]

export default function Timeline({ currentIndex, playing, speed, onSetIndex, onTogglePlay, onSetSpeed, onReset }: Props) {
  const atEnd = currentIndex >= STEPS.length - 1

  return (
    <div className="timeline">
      <div className="timeline-controls">
        <button className="ctrl-btn" onClick={onReset} title="Restart" type="button">
          ⟲
        </button>
        <button className="ctrl-btn" onClick={() => onSetIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} title="Previous step" type="button">
          ‹
        </button>
        <button className="ctrl-btn ctrl-btn-play" onClick={onTogglePlay} title={playing ? 'Pause' : 'Play'} type="button">
          {playing ? '❚❚' : atEnd ? '⟲' : '▶'}
        </button>
        <button
          className="ctrl-btn"
          onClick={() => onSetIndex(Math.min(STEPS.length - 1, currentIndex + 1))}
          disabled={atEnd}
          title="Next step"
          type="button"
        >
          ›
        </button>
        <div className="speed-group">
          {SPEEDS.map(([ms, label]) => (
            <button key={ms} className={`speed-btn${speed === ms ? ' speed-btn-active' : ''}`} onClick={() => onSetSpeed(ms)} type="button">
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="timeline-track">
        {STEPS.map((s, i) => {
          const tool = TOOLS[s.phase]
          const isFirstOfPhase = s.phaseStep === 1
          return (
            <div key={s.id} className="timeline-slot">
              {isFirstOfPhase && (
                <div className="timeline-phase-label" style={{ color: tool.color }}>
                  {tool.name}
                </div>
              )}
              <button
                className={`timeline-dot${i === currentIndex ? ' timeline-dot-active' : ''}${i < currentIndex ? ' timeline-dot-done' : ''}`}
                style={{
                  borderColor: tool.color,
                  background: i <= currentIndex ? tool.color : 'transparent',
                }}
                onClick={() => onSetIndex(i)}
                title={`${i + 1}. ${s.title}`}
                type="button"
              />
            </div>
          )
        })}
      </div>
      <div className="timeline-caption">
        Step {currentIndex + 1} of {STEPS.length}
      </div>
    </div>
  )
}
