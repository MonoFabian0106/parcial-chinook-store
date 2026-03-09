import os


class Settings:
    app_name: str = "Parcial Chinook Store API"
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql+psycopg2://postgres:123@localhost:5432/chinook"
    )


settings = Settings()
