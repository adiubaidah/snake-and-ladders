import { Button } from "@/components/ui/button"

function StartGame() {

    const handleStartGame = () => {
        
    }
  return (
    <div>
      <h1 className="text-3xl font-bold">Start Game</h1>
      <Button className="mt-4" onClick={handleStartGame}>Start</Button>
    </div>
  )
}

export default StartGame