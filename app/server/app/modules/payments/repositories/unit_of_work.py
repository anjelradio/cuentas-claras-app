from sqlmodel import Session


class PaymentUnitOfWork:
    """Límite transaccional del módulo payments, responsable exclusivo de commit y rollback."""

    def __init__(self, session: Session):
        self._session = session

    def commit(self) -> None:
        self._session.commit()

    def rollback(self) -> None:
        self._session.rollback()
