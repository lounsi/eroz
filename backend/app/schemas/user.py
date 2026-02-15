from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UpdateRoleRequest(BaseModel):
    role: str


class UserAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    firstName: str
    lastName: str
    email: str
    role: str
    createdAt: datetime
