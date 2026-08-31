from io import BytesIO

import pytest
from PIL import Image

from app.modules.events.services.qr_service import QrService


@pytest.mark.parametrize(
    ("content_type", "image_format"),
    [
        ("image/jpeg", "JPEG"),
        ("image/png", "PNG"),
        ("image/webp", "WEBP"),
    ],
)
def test_qr_file_signature_matches_declared_supported_type(
    content_type: str, image_format: str
) -> None:
    buffer = BytesIO()
    Image.new("RGB", (2, 2), color="white").save(buffer, format=image_format)
    content = buffer.getvalue()
    assert QrService._matches_declared_image_type(content_type, content)


@pytest.mark.parametrize(
    ("content_type", "content"),
    [
        ("image/jpeg", b"not-an-image"),
        ("image/png", b"\xff\xd8\xff\xe0jpeg-declared-as-png"),
        ("image/webp", b"RIFF\x00\x00\x00\x00NOPEnot-webp"),
    ],
)
def test_qr_file_signature_rejects_mislabeled_or_corrupt_content(
    content_type: str, content: bytes
) -> None:
    assert not QrService._matches_declared_image_type(content_type, content)
