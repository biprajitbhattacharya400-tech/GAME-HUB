from fastapi import APIRouter
import random

router = APIRouter()

@router.get("/")
def home():
    return {"message": "Game Hub Running 🎮"}

@router.get("/play/{choice}")
def play(choice: str):
    choices = ["rock", "paper", "scissor"]
    computer = random.choice(choices)

    if choice == computer:
        result = "draw"
    elif (
        (choice == "rock" and computer == "scissor") or
        (choice == "paper" and computer == "rock") or
        (choice == "scissor" and computer == "paper")
    ):
        result = "win"
    else:
        result = "lose"

    return {
        "player": choice,
        "computer": computer,
        "result": result
    }