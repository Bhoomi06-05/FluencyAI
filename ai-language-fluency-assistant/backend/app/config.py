from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Language Fluency Assistant"
    secret_key: str
    database_url: str = "sqlite:///./database/app.db"

    # mock | anthropic | openai_compatible
    llm_provider: str = "mock"
    anthropic_api_key: str = ""

    # openai_compatible provider ke liye (Gemini, Groq, Ollama...)
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()