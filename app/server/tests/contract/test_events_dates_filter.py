from datetime import UTC, datetime

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.modules.events.schemas.event_schemas import (
    EventCreateRequest,
    EventSummaryRead,
)


def test_event_create_contract_requires_end_date() -> None:
    with pytest.raises(PydanticValidationError):
        EventCreateRequest(
            name="Evento",
            icon="🎉",
            starts_at=datetime(2026, 8, 31, tzinfo=UTC),
        )


def test_event_summary_contract_exposes_end_date_and_member_count() -> None:
    summary = EventSummaryRead(
        id="00000000-0000-0000-0000-000000000001",
        name="Evento",
        icon="🎉",
        starts_at=datetime(2026, 8, 31, tzinfo=UTC),
        ends_at=datetime(2026, 8, 31, tzinfo=UTC),
        status="open",
        member_count=2,
    )

    assert summary.ends_at == summary.starts_at
    assert summary.member_count == 2
