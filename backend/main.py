from fastapi import FastAPI
from api.main import api_router
from fastapi.middleware.cors import CORSMiddleware

# Inicializar tablas si no hay migraciones todavía

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Todos los orígenes (solo para desarrollo)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Parcial Chinook Store API Index Route"}

app.include_router(api_router, prefix="/api")
