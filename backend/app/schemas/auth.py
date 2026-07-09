from pydantic import BaseModel


class LoginRequest(BaseModel):
    ten_dang_nhap: str
    mat_khau: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
