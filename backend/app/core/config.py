from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SECRET_KEY = "change_this_to_a_random_secret_string"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"  # development | production

    DATABASE_URL: str = "postgresql+asyncpg://xphc_app_role:change_me@localhost:5432/xphc_db"
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    STORAGE_DIR: str = "./storage"
    CORS_ORIGINS: str = "http://localhost:5173"
    MAX_UPLOAD_SIZE_MB: int = 25

    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 5

    # ===== Cau hinh white-label - doi khi trien khai cho don vi/khach hang moi =====
    TEN_DON_VI: str = "Phần mềm quản lý XPHC"
    TEN_DIA_PHUONG: str = "Xã Yên Xuân"
    TEN_CO_QUAN_CHU_QUAN: str = "Ủy ban nhân dân xã Yên Xuân"
    MO_TA_DON_VI: str = (
        "Hệ thống quản lý xử lý vi phạm hành chính, trật tự xây dựng, đất đai. "
        "Bản đồ số, hồ sơ điện tử, phân quyền theo tài khoản và nhật ký hệ thống minh bạch."
    )
    BAN_DO_VI_DO_MAC_DINH: float = 21.0278
    BAN_DO_KINH_DO_MAC_DINH: float = 105.8342
    BAN_DO_ZOOM_MAC_DINH: int = 13
    LOGO_URL: str | None = None

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def _validate_production_safety(self) -> "Settings":
        if self.is_production and self.SECRET_KEY == DEFAULT_SECRET_KEY:
            raise RuntimeError(
                "SECRET_KEY dang o gia tri mac dinh khong an toan. "
                "Hay dat SECRET_KEY ngau nhien (vi du: openssl rand -hex 32) truoc khi chay o production."
            )
        return self


settings = Settings()
