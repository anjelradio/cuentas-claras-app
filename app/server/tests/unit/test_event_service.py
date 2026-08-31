from datetime import UTC, datetime

import pytest

from app.core.errors import ValidationError
from app.modules.events.services.event_service import EventService


def test_event_period_accepts_same_day() -> None:
    date = datetime(2026, 8, 31, tzinfo=UTC)
    EventService._validate_date_range(date, date)


def test_event_period_rejects_end_before_start() -> None:
    start = datetime(2026, 9, 2, tzinfo=UTC)
    end = datetime(2026, 9, 1, tzinfo=UTC)

    with pytest.raises(ValidationError, match="fecha de fin"):
        EventService._validate_date_range(start, end)
