import string
import secrets
from uuid import UUID
from datetime import datetime, timedelta, UTC
from sqlmodel import Session
from app.core.config import get_settings
from app.core.errors import ForbiddenError
from app.modules.events.models.event_invitation import EventInvitation
from app.modules.events.repositories.invitation_repository import InvitationRepository
from app.modules.events.services.event_service import EventService

class InvitationService:
    def __init__(self, session: Session):
        self.session = session
        self.invitation_repo = InvitationRepository(session)
        self.event_service = EventService(session)

    def _generate_token(self) -> str:
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(6))

    def generate_invitation(self, event_id: UUID, user_id: str) -> EventInvitation:
        # Validar permisos
        event = self.event_service.get_event(event_id, user_id)
        if event.user_id != user_id:
            raise ForbiddenError("Solo el propietario puede generar invitaciones.")

        # Reutilizar activa si existe
        existing = self.invitation_repo.get_active_by_event(event_id)
        if existing:
            return existing

        # Crear nueva
        settings = get_settings()
        expires_at = datetime.now(UTC) + timedelta(days=settings.invitation_expire_days)
        
        # Opcional: garantizar que el token no colisione
        token = self._generate_token()
        while self.invitation_repo.get_by_token(token) is not None:
            token = self._generate_token()

        invitation = EventInvitation(
            event_id=event_id,
            token_hash=token,
            expires_at=expires_at
        )
        return self.invitation_repo.create(invitation)
