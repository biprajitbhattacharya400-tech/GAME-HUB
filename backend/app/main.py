from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import rps, tictactoe, snake

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rps.router, prefix="/rps")
app.include_router(tictactoe.router, prefix="/tictactoe")
app.include_router(snake.router, prefix="/snake")