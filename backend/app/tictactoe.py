from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import random

router = APIRouter()

class TTTRequest(BaseModel):
    board: List[str] # List of 9 strings: 'X', 'O', or ''

def check_winner(b):
    lines = [(0,1,2),(3,4,5),(6,7,8),(0,3,6),(1,4,7),(2,5,8),(0,4,8),(2,4,6)]
    for (x,y,z) in lines:
        if b[x] and b[x] == b[y] and b[x] == b[z]:
            return b[x], [x,y,z]
    if '' not in b: return "Draw", []
    return None, []

def minimax(b, is_max):
    winner, _ = check_winner(b)
    if winner == 'O': return 10
    if winner == 'X': return -10
    if winner == "Draw": return 0

    if is_max:
        best = -1000
        for i in range(9):
            if b[i] == '':
                b[i] = 'O'
                best = max(best, minimax(b, not is_max))
                b[i] = ''
        return best
    else:
        best = 1000
        for i in range(9):
            if b[i] == '':
                b[i] = 'X'
                best = min(best, minimax(b, not is_max))
                b[i] = ''
        return best

@router.post("/move")
def move(req: TTTRequest):
    b = req.board.copy()
    winner, line = check_winner(b)
    if winner: 
        return {"board": b, "winner": winner, "line": line}

    # Computer plays 'O'. Uses basic intelligent fallback to avoid deep recursion hangs on empty board
    empty_spots = [i for i, x in enumerate(b) if x == '']
    
    # If computer moves first
    if len(empty_spots) == 9:
        b[random.choice([0,2,4,6,8])] = 'O'
    elif len(empty_spots) >= 8:
        spot = random.choice(empty_spots) if b[4] == 'X' else 4
        b[spot] = 'O'
    else:
        # Minimax logic
        best_val = -1000
        best_moves = []
        for i in range(9):
            if b[i] == '':
                b[i] = 'O'
                move_val = minimax(b, False)
                b[i] = ''
                if move_val > best_val:
                    best_val = move_val
                    best_moves = [i]
                elif move_val == best_val:
                    best_moves.append(i)
        
        if best_moves:
            b[random.choice(best_moves)] = 'O'
        
    winner, line = check_winner(b)
    return {"board": b, "winner": winner, "line": line}
