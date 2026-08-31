from pydantic import BaseModel


class MyQrRead(BaseModel):
    image_url: str | None
