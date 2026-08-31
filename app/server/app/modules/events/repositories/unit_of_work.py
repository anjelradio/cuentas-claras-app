from sqlmodel import Session


class EventUnitOfWork:
    """Límite transaccional del módulo events, oculto a los services."""

    def __init__(self, session: Session):
        self._session = session

    def commit(self) -> None:
        self._session.commit()

    def rollback(self) -> None:
        self._session.rollback()
