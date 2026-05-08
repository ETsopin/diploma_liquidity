"""
Конфигурация системы — читается из .env / переменных окружения.
"""
from __future__ import annotations

from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class DwhSettings(BaseSettings):
    host: str = Field("localhost", alias="DWH_DB_HOST")
    port: int = Field(5432,        alias="DWH_DB_PORT")
    name: str = Field("liquidity_dwh", alias="DWH_DB_NAME")
    user: str = Field("dwh_user", alias="DWH_DB_USER")
    password: str = Field("dwh_password", alias="DWH_DB_PASSWORD")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.name}"
        )

    @property
    def dsn(self) -> str:
        return (
            f"host={self.host} port={self.port} dbname={self.name} "
            f"user={self.user} password={self.password}"
        )


class SourceDbSettings(BaseSettings):
    host: str = Field("localhost",  alias="SOURCE_DB_HOST")
    port: int = Field(5433,         alias="SOURCE_DB_PORT")
    name: str = Field("bank_abs",   alias="SOURCE_DB_NAME")
    user: str = Field("abs_user",   alias="SOURCE_DB_USER")
    password: str = Field("abs_password", alias="SOURCE_DB_PASSWORD")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.name}"
        )

    @property
    def dsn(self) -> str:
        return (
            f"host={self.host} port={self.port} dbname={self.name} "
            f"user={self.user} password={self.password}"
        )


class AppSettings(BaseSettings):
    excel_source_dir: Path = Field(
        Path("data/excel_sources"), alias="EXCEL_SOURCE_DIR"
    )
    reports_output_dir: Path = Field(
        Path("data/reports"), alias="REPORTS_OUTPUT_DIR"
    )
    api_host: str = Field("0.0.0.0", alias="API_HOST")
    api_port: int = Field(8000,       alias="API_PORT")
    secret_key: str = Field("change_me", alias="SECRET_KEY")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Глобальные синглтоны — импортируй из любого модуля
dwh_settings    = DwhSettings()
source_settings = SourceDbSettings()
app_settings    = AppSettings()
