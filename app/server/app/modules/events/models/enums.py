from enum import Enum

class EventStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"

class MemberStatus(str, Enum):
    ACTIVE = "active"
    LEFT = "left"
    REMOVED = "removed"
