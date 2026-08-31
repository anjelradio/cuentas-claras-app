from enum import StrEnum


class EventStatus(StrEnum):
    OPEN = "open"
    CLOSED = "closed"


class MemberStatus(StrEnum):
    ACTIVE = "active"
    LEFT = "left"
    REMOVED = "removed"
