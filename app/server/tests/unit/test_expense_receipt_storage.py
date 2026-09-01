from io import BytesIO
from unittest.mock import patch

import pytest
from PIL import Image

from app.core.config import Settings
from app.core.errors import ValidationError
from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage


def create_test_image_bytes(format="JPEG", size=(100, 100)) -> bytes:
    buf = BytesIO()
    img = Image.new("RGB", size, color="blue")
    img.save(buf, format=format)
    return buf.getvalue()


@pytest.fixture
def storage():
    settings = Settings(
        cloudinary_cloud_name="test-cloud",
        cloudinary_api_key="test-key",
        cloudinary_api_secret="test-secret",
    )
    return ExpenseReceiptStorage(settings)


def test_validate_receipt_accepts_valid_jpeg(storage):
    content = create_test_image_bytes(format="JPEG")
    storage.validate_file(content, "image/jpeg")


def test_validate_receipt_accepts_valid_png(storage):
    content = create_test_image_bytes(format="PNG")
    storage.validate_file(content, "image/png")


def test_validate_receipt_accepts_valid_webp(storage):
    content = create_test_image_bytes(format="WEBP")
    storage.validate_file(content, "image/webp")


def test_validate_receipt_rejects_exceeding_size(storage):
    large_content = b"0" * (5 * 1024 * 1024 + 1)
    with pytest.raises(ValidationError, match="excede el tamaño máximo"):
        storage.validate_file(large_content, "image/jpeg")


def test_validate_receipt_rejects_invalid_mime(storage):
    content = create_test_image_bytes(format="JPEG")
    with pytest.raises(ValidationError, match="Formato no permitido"):
        storage.validate_file(content, "application/pdf")


def test_validate_receipt_rejects_corrupted_image(storage):
    with pytest.raises(ValidationError, match="no es una imagen válida"):
        storage.validate_file(b"not an image", "image/jpeg")


@patch("cloudinary.uploader.upload")
def test_upload_receipt_success(mock_upload, storage):
    mock_upload.return_value = {
        "secure_url": "https://res.cloudinary.com/test/image/upload/receipt.jpg",
        "public_id": "receipts/event-123/abc-123",
    }
    content = create_test_image_bytes(format="JPEG")
    result = storage.upload_receipt(content, "event-123", "image/jpeg")

    assert result.secure_url == "https://res.cloudinary.com/test/image/upload/receipt.jpg"
    assert result.public_id == "receipts/event-123/abc-123"
    mock_upload.assert_called_once()


@patch("cloudinary.uploader.destroy")
def test_destroy_receipt_success(mock_destroy, storage):
    mock_destroy.return_value = {"result": "ok"}
    storage.destroy("receipts/event-123/abc-123")
    mock_destroy.assert_called_once_with(
        "receipts/event-123/abc-123",
        resource_type="image",
        invalidate=True,
    )
