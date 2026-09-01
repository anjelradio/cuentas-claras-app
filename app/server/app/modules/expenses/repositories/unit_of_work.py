from sqlmodel import Session


class ExpenseUnitOfWork:
    """Límite transaccional del módulo expenses, responsable exclusivo de commit y rollback."""

    def __init__(self, session: Session):
        self._session = session

    def commit(self) -> None:
        self._session.commit()

    def rollback(self) -> None:
        self._session.rollback()
