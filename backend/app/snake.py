from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
import random

router = APIRouter()

class Position(BaseModel):
    x: int
    y: int

class SnakeRequest(BaseModel):
    snake: List[Position]
    direction: str # UP, DOWN, LEFT, RIGHT
    food: Position
    grid_size: int = 15

@router.post("/tick")
def tick(req: SnakeRequest):
    if not req.snake:
        return {"status": "game_over", "snake": req.snake, "food": req.food}
        
    head = req.snake[0]
    new_head = Position(x=head.x, y=head.y)
    
    if req.direction == "UP": new_head.y -= 1
    elif req.direction == "DOWN": new_head.y += 1
    elif req.direction == "LEFT": new_head.x -= 1
    elif req.direction == "RIGHT": new_head.x += 1

    # Collision with walls
    if new_head.x < 0 or new_head.x >= req.grid_size or new_head.y < 0 or new_head.y >= req.grid_size:
        return {"status": "game_over", "snake": [p.dict() for p in req.snake], "food": req.food.dict()}

    # Collision with self (exclude tail tip since it moves forward synchronously)
    for part in req.snake[:-1]:
        if new_head.x == part.x and new_head.y == part.y:
            return {"status": "game_over", "snake": [p.dict() for p in req.snake], "food": req.food.dict()}

    new_snake = [new_head] + req.snake
    food = req.food
    status = "alive"

    # Eats food
    if new_head.x == req.food.x and new_head.y == req.food.y:
        while True:
            fx = random.randint(0, req.grid_size - 1)
            fy = random.randint(0, req.grid_size - 1)
            if not any(p.x == fx and p.y == fy for p in new_snake):
                food = Position(x=fx, y=fy)
                break
    else:
        new_snake.pop() # Remove tail if not eating
        
    return {"status": status, "snake": [p.dict() for p in new_snake], "food": food.dict()}
