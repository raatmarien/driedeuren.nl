import { useState, useRef, useCallback } from 'react'
import './Simulation.css'

type SimulationState = 'idle' | 'running' | 'finished'

interface SimulationResult {
  won: boolean
}

interface SimulationDoorState {
  carDoor: number
  selectedDoor: number
  revealedDoor: number
  finalChoice: number
  phase: 'selecting' | 'revealed' | 'final'
  instant: boolean
}

function Simulation() {
  const [simulationState, setSimulationState] = useState<SimulationState>('idle')
  const [strategy, setStrategy] = useState<'switch' | 'stay' | null>(null)
  const [results, setResults] = useState<SimulationResult[]>([])
  const [doorState, setDoorState] = useState<SimulationDoorState | null>(null)
  const runIdRef = useRef(0)

  const runSimulation = useCallback(async (shouldSwitch: boolean) => {
    const myRunId = ++runIdRef.current
    const isActive = () => runIdRef.current === myRunId
    setSimulationState('running')
    setStrategy(shouldSwitch ? 'switch' : 'stay')
    setResults([])
    
    const totalGames = 100
    const maxDelay = 1200 // First game delay
    const minDelay = 100  // Final game delay
    
    const getDelayForGame = (gameIndex: number): number => {
      let delay = Math.max(maxDelay * Math.pow(0.9, gameIndex), minDelay)
      if (gameIndex > (totalGames - 15)) {
        delay *= Math.pow(1.5, (gameIndex - totalGames + 10))
        delay = Math.min(maxDelay, delay)
      }
      return delay
    }
    
    for (let i = 0; i < totalGames; i++) {
      if (!isActive()) return

      const delayPerGame = getDelayForGame(i)

      // Generate game data
      const carDoor = Math.floor(Math.random() * 3)
      const selectedDoor = Math.floor(Math.random() * 3)
      const availableDoors = [0, 1, 2].filter(
        d => d !== selectedDoor && d !== carDoor
      )
      const revealedDoor = availableDoors[Math.floor(Math.random() * availableDoors.length)]

      let finalChoice: number
      if (shouldSwitch) {
        finalChoice = [0, 1, 2].find(d => d !== selectedDoor && d !== revealedDoor)!
      } else {
        finalChoice = selectedDoor
      }

      const instant = delayPerGame < 500

      // Phase 1: Show selection
      setDoorState({
        carDoor,
        selectedDoor,
        revealedDoor,
        finalChoice,
        phase: 'selecting',
        instant
      })
      await new Promise(r => setTimeout(r, delayPerGame * 0.3))

      if (!isActive()) return

      // Phase 2: Reveal host's door
      setDoorState(prev => prev ? { ...prev, phase: 'revealed' } : null)
      await new Promise(r => setTimeout(r, delayPerGame * 0.3))

      if (!isActive()) return

      // Phase 3: Final choice and result
      setDoorState(prev => prev ? { ...prev, phase: 'final' } : null)
      await new Promise(r => setTimeout(r, delayPerGame * 0.4))

      if (!isActive()) return

      // Add result
      const won = finalChoice === carDoor
      setResults(prev => [...prev, { won }])
    }

    if (isActive()) setSimulationState('finished')
  }, [])

  const stopSimulation = useCallback(() => {
    runIdRef.current++
    setSimulationState('finished')
  }, [])

  const resetSimulation = useCallback(() => {
    runIdRef.current++
    setSimulationState('idle')
    setStrategy(null)
    setResults([])
    setDoorState(null)
  }, [])

  const wins = results.filter(r => r.won).length
  const losses = results.length - wins
  const winPercentage = results.length > 0 ? ((wins / results.length) * 100).toFixed(1) : '0'

  const getDoorContent = (doorIndex: number) => {
    if (!doorState) return null
    
    if (doorState.phase === 'final') {
      return doorIndex === doorState.carDoor ? '🚗' : '🐐'
    }
    if (doorState.phase === 'revealed' && doorIndex === doorState.revealedDoor) {
      return '🐐'
    }
    return null
  }

  const isDoorRevealed = (doorIndex: number) => {
    if (!doorState) return false
    return doorState.phase === 'final' || 
      (doorState.phase === 'revealed' && doorIndex === doorState.revealedDoor)
  }

  return (
    <section className="simulation-section">
      <h2>Simuleer 100 spelletjes</h2>
      <p className="simulation-intro">
        Benieuwd of wisselen echt beter is? Laat de computer 100 spelletjes spelen en zie het zelf!
      </p>

      {simulationState === 'idle' && (
        <div className="simulation-buttons">
          <button 
            className="btn btn-simulate btn-switch-sim"
            onClick={() => runSimulation(true)}
          >
            Simuleer 100x met wisselen
          </button>
          <button 
            className="btn btn-simulate btn-stay-sim"
            onClick={() => runSimulation(false)}
          >
            Simuleer 100x met blijven
          </button>
        </div>
      )}

      {simulationState !== 'idle' && (
        <>
          <div className="simulation-header">
            <h3>
              Strategie: {strategy === 'switch' ? 'Wisselen' : 'Blijven'}
            </h3>
            {simulationState === 'running' && (
              <button className="btn btn-stop" onClick={stopSimulation}>
                Stop
              </button>
            )}
            {simulationState === 'finished' && (
              <button className="btn btn-reset" onClick={resetSimulation}>
                Opnieuw
              </button>
            )}
          </div>

          {/* Mini door visualization */}
          {doorState && simulationState === 'running' && (
            <div className={`mini-doors ${doorState.instant ? 'instant' : ''}`}>
              {[0, 1, 2].map(doorIndex => {
                const open = isDoorRevealed(doorIndex)
                const isStarred = doorState.phase !== 'final' && doorState.selectedDoor === doorIndex
                const isDimmed = doorState.phase === 'final' && doorState.finalChoice !== doorIndex
                return (
                  <div key={doorIndex} className="door-container door-container-mini">
                    <div className={`door-slot ${open ? 'open' : ''} ${isDimmed ? 'dimmed' : ''}`}>
                      <div className="door-inside">
                        {open && (
                          <span className="door-content">{getDoorContent(doorIndex)}</span>
                        )}
                      </div>
                      <button className="door" disabled>
                        {isStarred && <span className="door-star">⭐</span>}
                      </button>
                    </div>
                    <span
                      className="door-star-below"
                      style={{
                        visibility:
                          doorState.phase === 'final' && doorState.finalChoice === doorIndex
                            ? 'visible'
                            : 'hidden',
                      }}
                      aria-hidden={!(doorState.phase === 'final' && doorState.finalChoice === doorIndex)}
                    >
                      ⭐
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Progress */}
          <div className="simulation-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${results.length}%` }}
              />
            </div>
            <span className="progress-text">{results.length} / 100 spelletjes</span>
          </div>

          {/* Results list */}
          <div className="results-list">
            {results.map((result, index) => (
              <span key={index} className="result-emoji" title={`Spel ${index + 1}: ${result.won ? 'Gewonnen' : 'Verloren'}`}>
                {result.won ? '🚗' : '🐐'}
              </span>
            ))}
          </div>

          {/* Summary */}
          {simulationState === 'finished' && results.length > 0 && (
            <div className="simulation-summary">
              <h3>Uitslag</h3>
              <div className="summary-stats">
                <div className="summary-stat win">
                  <span className="summary-value">{wins}</span>
                  <span className="summary-label">🚗 Gewonnen</span>
                </div>
                <div className="summary-stat lose">
                  <span className="summary-value">{losses}</span>
                  <span className="summary-label">🐐 Verloren</span>
                </div>
                <div className="summary-stat percentage">
                  <span className="summary-value">{winPercentage}%</span>
                  <span className="summary-label">Winstpercentage</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Simulation
