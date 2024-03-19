import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Chess } from 'chess.js'

//this class makes use of the chess.js framework to aid with move validation, game state tracking

const Chessboard = dynamic(() => import('chessboardjsx'), { ssr: false });

const ChessGame: React.FC = () => {
  const [game, setGame] = useState<ChessInstance>(new Chess());
  const [position, setPosition] = useState('start');

    useEffect(() => {
      startNewGame();
    }, []);



  const handleMove = async (sourceSquare, targetSquare) => {
    // Make the move on the front end first
    const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });

      console.log(`Attempting move from ${sourceSquare} to ${targetSquare}`);

      // Ensuring the source and target squares are different
      if (sourceSquare === targetSquare) {
        console.error("Invalid move: source and target squares are the same.");
        return;
      }

    // If the move is legal
    if (move !== null) {
      // Update the board's FEN string
      setPosition(game.fen());

      // Sending the move to the backend
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/chess/move`;
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `playerMove=${sourceSquare}${targetSquare}`
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        // receive best move from stockfish
        const bestMove = await response.text();

        // Ai move
        game.move(bestMove);
        // Update position with new Fen
        setPosition(game.fen());

      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      }
    }
  };

    const startNewGame = async () => {
      await startEngine(); // Ensure the engine is started
      try {
        const response = await fetch(`${apiUrl}/api/chess/startNewGame`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Failed to start new game');
        }
        console.log('New game started');
        setGame(new Chess()); // Reset the game state
        setPosition('start'); // Reset the board position
      } catch (error) {
        console.error('Error starting new game:', error);
      }
    };

  return (
  <div>
    <Chessboard
      width={320}
      position={position} // Using FEN for position
      onDrop={({ sourceSquare, targetSquare }) => {
        handleMove(sourceSquare, targetSquare);
      }}
    />
<Link href="/" className="mt-8 btn bg-accent hover:bg-red-700 text-white font-semibold rounded-full py-2 px-6">Back to home</Link>    </div>
  );
};

export default ChessGame;

