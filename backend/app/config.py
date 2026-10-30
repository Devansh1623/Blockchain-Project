from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./chainsleuth.db"
    ml_model_path: str = "./app/ml/artifacts/model.pkl"
    ml_version_path: str = "./app/ml/artifacts/version.json"

    rpc_url: str = ""
    reporter_private_key: str = ""
    contract_address: str = ""
    chain_id: int = 11155111
    etherscan_url: str = "https://sepolia.etherscan.io"

    cors_origins: str = "http://localhost:5173"
    max_upload_rows: int = 10000

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def blockchain_enabled(self) -> bool:
        return bool(self.rpc_url and self.reporter_private_key and self.contract_address)


@lru_cache
def get_settings() -> Settings:
    return Settings()
