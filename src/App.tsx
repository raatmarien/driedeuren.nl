import { useState } from 'react'
import './App.css'
import Simulation from './Simulation'

type GameState = 'selecting' | 'pre-reveal' | 'host-reveal' | 'pre-result' | 'result'

function App() {
  const [gameState, setGameState] = useState<GameState>('selecting')
  const [selectedDoor, setSelectedDoor] = useState<number | null>(null)
  const [carDoor, setCarDoor] = useState<number>(() => Math.floor(Math.random() * 3))
  const [revealedDoor, setRevealedDoor] = useState<number | null>(null)
  const [finalChoice, setFinalChoice] = useState<number | null>(null)
  const [didSwitch, setDidSwitch] = useState<boolean>(false)

  const handleDoorClick = (doorIndex: number) => {
    if (gameState === 'selecting') {
      setSelectedDoor(doorIndex)
      
      // Host reveals a door with a goat (not the selected door and not the car door)
      const availableDoors = [0, 1, 2].filter(
        d => d !== doorIndex && d !== carDoor
      )
      // eslint-disable-next-line react-hooks/purity
      const doorToReveal = availableDoors[Math.floor(Math.random() * availableDoors.length)]
      setRevealedDoor(doorToReveal)
      setGameState('pre-reveal')
    }
  }

  const handleOpenDoor = () => {
    setGameState('host-reveal')
  }

  const handleSwitch = () => {
    // Auto-select the remaining door (not selected and not revealed)
    const remainingDoor = [0, 1, 2].find(d => d !== selectedDoor && d !== revealedDoor)
    if (remainingDoor !== undefined) {
      setFinalChoice(remainingDoor)
      setGameState('pre-result')
      setDidSwitch(true)
    }
  }

  const handleStay = () => {
    setFinalChoice(selectedDoor)
    setGameState('pre-result')
    setDidSwitch(false)
  }

  const handleOpenAllDoors = () => {
    setGameState('result')
  }

  const resetGame = () => {
    setGameState('selecting')
    setSelectedDoor(null)
    setCarDoor(Math.floor(Math.random() * 3))
    setRevealedDoor(null)
    setFinalChoice(null)
  }

  const getDoorContent = (doorIndex: number) => {
    if (gameState === 'result') {
      return doorIndex === carDoor ? '🚗' : '🐐'
    }
    if ((gameState === 'host-reveal' || gameState === 'pre-result') && doorIndex === revealedDoor) {
      return '🐐'
    }
    return null
  }

  const isDoorRevealed = (doorIndex: number) => {
    return gameState === 'result' ||
      ((gameState === 'host-reveal' || gameState === 'pre-result') && doorIndex === revealedDoor)
  }

  const isDoorClickable = () => {
    return gameState === 'selecting'
  }

  const doorName = (doorIndex: number) =>
    ['linkerdeur', 'middelste deur', 'rechterdeur'][doorIndex]

  return (
    <div className="app">
      <header className="header">
        <h1>Het Driedeurenprobleem</h1>
        <p className="subtitle">Speel het zelf, of simuleer het hier</p>
      </header>

      <main className="main">
        <section className="game-section">
          <div className="instructions">
            {gameState === 'selecting' && (
              <p>Je doet mee aan een spelshow met als hoofdprijs een gloednieuwe auto. De presentator laat je drie deuren zien. Achter één van die deuren staat de auto die je heel graag wilt winnen, achter de andere twee deuren staat een geit. Welke van de drie deuren kies je?</p>
            )}
            {gameState === 'pre-reveal' && (
              <>
                <p>Je hebt de {doorName(selectedDoor!)} aangewezen. De presentator vraagt of je het zeker weet. Je knikt. Dan zegt de presentator dat hij je gaat helpen door een deur met een geit erachter te openen.</p>
                <button className="btn btn-switch" onClick={handleOpenDoor}>
                  Ga door
                </button>
              </>
            )}
            {gameState === 'host-reveal' && (
              <>
                <p>De presentator opent de {doorName(revealedDoor!)} en laat zien dat daar een geit staat. Nu vraagt de presentator je nog één keer of je bij de {doorName(selectedDoor!)} blijft. Je mag ook nog ruilen naar de {doorName([0, 1, 2].find(d => d !== selectedDoor && d !== revealedDoor)!)}.</p>
                <p><strong>Wil je wisselen?</strong></p>
                <div className="choice-buttons">
                  <button className="btn btn-stay" onClick={handleStay}>
                    Blijf bij de {doorName(selectedDoor!)}
                  </button>
                  <button className="btn btn-switch" onClick={handleSwitch}>
                    Wissel naar de {doorName([0, 1, 2].find(d => d !== selectedDoor && d !== revealedDoor)!)}
                  </button>
                </div>
              </>
            )}
            {gameState === 'pre-result' && (
              <>
                <p>{didSwitch ? 'Je wisselt naar de' : 'Je blijft bij de'} {doorName(finalChoice!)}, ben je klaar om te zien of je een auto hebt gewonnen?</p>
                <button className="btn btn-switch" onClick={handleOpenAllDoors}>
                  Open alle deuren
                </button>
              </>
            )}
            {gameState === 'result' && (
              <p className={finalChoice === carDoor ? 'result-win' : 'result-lose'}>
                {finalChoice === carDoor
                ? 'Gefeliciteerd! Je hebt de auto gewonnen!'
                : 'Mèèèèh! Je hebt een geit gewonnen'}
              </p>
            )}
          </div>

          <div className="doors">
            {[0, 1, 2].map(doorIndex => {
              const isSelected =
                (selectedDoor === doorIndex && (gameState === 'selecting' || gameState === 'pre-reveal' || gameState === 'host-reveal')) ||
                (finalChoice === doorIndex && gameState === 'pre-result')
              const isDimmed = gameState === 'result' && finalChoice !== doorIndex
              const open = isDoorRevealed(doorIndex)
              return (
                <div key={doorIndex} className="door-container">
                  <div className={`door-slot ${open ? 'open' : ''} ${isDimmed ? 'dimmed' : ''}`}>
                    <div className="door-inside">
                      {open && (
                        <span className="door-content">{getDoorContent(doorIndex)}</span>
                      )}
                    </div>
                    <button
                      className={`door ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleDoorClick(doorIndex)}
                      disabled={!isDoorClickable()}
                    >
                      {isSelected && <span className="door-star">⭐</span>}
                    </button>
                  </div>
                  {gameState === 'result' && finalChoice === doorIndex && (
                    <span className="door-star-below">⭐</span>
                  )}
                </div>
              )
            })}
          </div>

          {gameState === 'result' && (
            <div className="reset-row">
              <button className="btn btn-reset" onClick={resetGame}>
                Speel opnieuw
              </button>
            </div>
          )}
        </section>

        <Simulation />
      </main>
      <footer className="footer">
        Open source onder de <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">GNU aGPL v3+</a>. Bekijk de broncode op <a href="https://github.com/raatmarien/driedeuren.nl">https://github.com/raatmarien/driedeuren.nl</a>.
      </footer>
    </div>
  )
}

export default App
