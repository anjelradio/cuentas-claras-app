from datetime import UTC, datetime
from uuid import UUID

from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.modules.activity.services.activity import ActivityService
from app.modules.events.services.expense_context_service import ExpenseContextService
from app.modules.expenses.integrations.receipt_storage import ExpenseReceiptStorage
from app.modules.expenses.repositories.expense_repository import ExpenseRepository
from app.modules.expenses.repositories.expense_split_repository import ExpenseSplitRepository
from app.modules.payments.models.enums import PaymentMethod, PaymentStatus
from app.modules.payments.models.payment import Payment
from app.modules.payments.repositories.payment_repository import PaymentRepository
from app.modules.payments.repositories.unit_of_work import PaymentUnitOfWork
from app.modules.payments.schemas.payment_schemas import (
    PayerQrRead,
    PaymentCreateRequest,
    PaymentRead,
    PaymentResolutionRead,
    PendingVerificationPaymentRead,
)


class PaymentService:
    def __init__(
        self,
        payment_repo: PaymentRepository,
        split_repo: ExpenseSplitRepository,
        expense_repo: ExpenseRepository,
        uow: PaymentUnitOfWork,
        event_context: ExpenseContextService,
        activity_service: ActivityService,
        proof_storage: ExpenseReceiptStorage | None = None,
    ):
        self.payment_repo = payment_repo
        self.split_repo = split_repo
        self.expense_repo = expense_repo
        self.uow = uow
        self.event_context = event_context
        self.activity_service = activity_service
        self.proof_storage = proof_storage

    def get_payer_qr(self, expense_id: UUID, user_id: str) -> PayerQrRead:
        expense = self.expense_repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("El gasto solicitado no existe.")

        self.event_context.require_active_member(expense.event_id, user_id)

        payer_member = self.event_context.members.get_by_id(expense.paid_by_member_id)
        if payer_member is None:
            raise NotFoundError("El miembro pagador no fue encontrado.")

        payer_name = self.event_context.events.owner_name(payer_member.user_id) or "Pagador"
        has_qr = bool(payer_member.qr_image)

        return PayerQrRead(
            payer_member_id=payer_member.id,
            payer_name=payer_name,
            has_qr=has_qr,
            qr_image_url=payer_member.qr_image,
        )

    def declare_payment(
        self,
        expense_id: UUID,
        split_id: UUID,
        user_id: str,
        request_data: PaymentCreateRequest,
        file_content: bytes | None = None,
        content_type: str | None = None,
    ) -> PaymentRead:
        expense = self.expense_repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("El gasto solicitado no existe.")

        context = self.event_context.require_active_member(expense.event_id, user_id)
        current_member_id = context.current_member.id

        if expense.paid_by_member_id == current_member_id:
            raise ValidationError("El pagador del gasto no puede declarar pagos sobre su propia cuenta.")

        # Buscar el split correspondiente
        splits = self.split_repo.list_active_by_expense(expense_id)
        target_split = next((s for s in splits if s.id == split_id), None)
        if target_split is None:
            raise NotFoundError("La cuota de participación solicitada no existe para este gasto.")

        if target_split.member_id != current_member_id:
            raise ForbiddenError("Solo el titular de la cuota puede declarar su pago.")

        # Verificar si ya existe un pago confirmado
        existing_payments = self.payment_repo.list_by_split_ids([split_id])
        for p in existing_payments:
            if p.status == PaymentStatus.CONFIRMED:
                raise ValidationError("Esta cuota ya ha sido pagada y confirmada.")
            if p.status == PaymentStatus.PENDING_CONFIRMATION:
                raise ValidationError("Ya existe una declaración de pago pendiente de confirmación.")

        proof_url: str | None = None
        proof_public_id: str | None = None

        if request_data.payment_method == PaymentMethod.QR:
            if not file_content:
                raise ValidationError("Debe adjuntar la imagen del comprobante de transferencia bancaria.")
            if self.proof_storage is None:
                raise ValidationError("El servicio de almacenamiento de comprobantes no está configurado.")
            stored_proof = self.proof_storage.upload_receipt(
                content=file_content,
                event_id=str(expense.event_id),
                content_type=content_type or "image/jpeg",
            )
            proof_url = stored_proof.secure_url
            proof_public_id = stored_proof.public_id

        payment = Payment(
            split_id=split_id,
            payment_method=request_data.payment_method,
            status=PaymentStatus.PENDING_CONFIRMATION,
            proof_image_url=proof_url,
            proof_image_public_id=proof_public_id,
        )

        try:
            created_payment = self.payment_repo.create(payment)

            debtor_name = context.current_member.name
            method_label = "efectivo" if request_data.payment_method == PaymentMethod.CASH else "QR"
            self.activity_service.log_activity(
                event_id=str(expense.event_id),
                actor_id=user_id,
                actor_name=debtor_name,
                action_type="payment_declared",
                description=f"{debtor_name} declaró un pago de Bs. {target_split.assigned_amount:.2f} en {method_label} para el gasto {expense.name}",
                target_id=str(created_payment.id),
                target_name=expense.name,
            )
            self.uow.commit()
        except Exception:
            self.uow.rollback()
            if proof_public_id and self.proof_storage:
                self.proof_storage.destroy(proof_public_id)
            raise

        return PaymentRead(
            id=created_payment.id,
            split_id=target_split.id,
            expense_id=expense.id,
            debtor_member_id=target_split.member_id,
            debtor_name=context.current_member.name,
            amount=target_split.assigned_amount,
            payment_method=created_payment.payment_method,
            status=created_payment.status,
            proof_image_url=created_payment.proof_image_url,
            created_at=created_payment.created_at,
            confirmed_at=created_payment.confirmed_at,
            rejection_reason=created_payment.rejection_reason,
        )

    def confirm_payment(self, payment_id: UUID, user_id: str) -> PaymentResolutionRead:
        payment = self.payment_repo.get_by_id(payment_id)
        if payment is None:
            raise NotFoundError("El pago solicitado no existe.")

        # Buscar el split y el expense
        splits_all = self.split_repo.session.exec(
            self.split_repo.session.query(type(self.split_repo.session)).__class__
        ) if False else None
        
        # Buscar split directamente
        from app.modules.expenses.models.expense_split import ExpenseSplit
        split = self.payment_repo.session.get(ExpenseSplit, payment.split_id)
        if split is None:
            raise NotFoundError("La cuota asociada a este pago no existe.")

        expense = self.expense_repo.get_by_id(split.expense_id)
        if expense is None:
            raise NotFoundError("El gasto asociado a este pago no existe.")

        context = self.event_context.require_active_member(expense.event_id, user_id)
        if expense.paid_by_member_id != context.current_member.id:
            raise ForbiddenError("Solo la persona que pagó el gasto original puede confirmar este pago.")

        if payment.status != PaymentStatus.PENDING_CONFIRMATION:
            raise ValidationError("El pago no se encuentra en estado pendiente de confirmación.")

        now = datetime.now(UTC)
        payment.status = PaymentStatus.CONFIRMED
        payment.confirmed_at = now
        payment.rejection_reason = None

        try:
            self.payment_repo.update(payment)

            debtor_name = self.event_context.member_name(split.member_id)
            payer_name = context.current_member.name
            self.activity_service.log_activity(
                event_id=str(expense.event_id),
                actor_id=user_id,
                actor_name=payer_name,
                action_type="payment_confirmed",
                description=f"{payer_name} confirmó el pago de Bs. {split.assigned_amount:.2f} de {debtor_name} para el gasto {expense.name}",
                target_id=str(payment.id),
                target_name=expense.name,
            )
            self.uow.commit()
        except Exception:
            self.uow.rollback()
            raise

        return PaymentResolutionRead(
            id=payment.id,
            split_id=split.id,
            status=payment.status,
            confirmed_at=payment.confirmed_at,
            rejection_reason=None,
        )

    def reject_payment(
        self, payment_id: UUID, user_id: str, rejection_reason: str | None = None
    ) -> PaymentResolutionRead:
        payment = self.payment_repo.get_by_id(payment_id)
        if payment is None:
            raise NotFoundError("El pago solicitado no existe.")

        from app.modules.expenses.models.expense_split import ExpenseSplit
        split = self.payment_repo.session.get(ExpenseSplit, payment.split_id)
        if split is None:
            raise NotFoundError("La cuota asociada a este pago no existe.")

        expense = self.expense_repo.get_by_id(split.expense_id)
        if expense is None:
            raise NotFoundError("El gasto asociado a este pago no existe.")

        context = self.event_context.require_active_member(expense.event_id, user_id)
        if expense.paid_by_member_id != context.current_member.id:
            raise ForbiddenError("Solo la persona que pagó el gasto original puede rechazar este pago.")

        if payment.status != PaymentStatus.PENDING_CONFIRMATION:
            raise ValidationError("El pago no se encuentra en estado pendiente de confirmación.")

        payment.status = PaymentStatus.REJECTED
        payment.rejection_reason = rejection_reason

        try:
            self.payment_repo.update(payment)

            debtor_name = self.event_context.member_name(split.member_id)
            payer_name = context.current_member.name
            self.activity_service.log_activity(
                event_id=str(expense.event_id),
                actor_id=user_id,
                actor_name=payer_name,
                action_type="payment_rejected",
                description=f"{payer_name} rechazó el pago de {debtor_name} para el gasto {expense.name}",
                target_id=str(payment.id),
                target_name=expense.name,
            )
            self.uow.commit()
        except Exception:
            self.uow.rollback()
            raise

        return PaymentResolutionRead(
            id=payment.id,
            split_id=split.id,
            status=payment.status,
            confirmed_at=None,
            rejection_reason=payment.rejection_reason,
        )

    def get_pending_verification(
        self, user_id: str
    ) -> list[PendingVerificationPaymentRead]:
        from sqlmodel import col, desc, select

        from app.modules.events.models.enums import EventStatus, MemberStatus
        from app.modules.events.models.event import Event
        from app.modules.events.models.event_member import EventMember
        from app.modules.expenses.models.expense import Expense
        from app.modules.expenses.models.expense_split import ExpenseSplit

        # 1. Obtener eventos y membresías del usuario
        members_query = (
            select(EventMember, Event)
            .join(Event, Event.id == EventMember.event_id)
            .where(
                EventMember.user_id == user_id,
                EventMember.status == MemberStatus.ACTIVE,
                EventMember.deleted_at.is_(None),
                Event.status == EventStatus.OPEN,
                Event.deleted_at.is_(None),
            )
        )
        rows = self.payment_repo.session.exec(members_query).all()
        if not rows:
            return []

        events_by_id = {event.id: event for _, event in rows}
        user_member_ids = [member.id for member, _ in rows]

        # 2. Gastos pagados por el usuario
        expenses = list(
            self.payment_repo.session.exec(
                select(Expense).where(
                    col(Expense.paid_by_member_id).in_(user_member_ids),
                    Expense.deleted_at.is_(None),
                )
            ).all()
        )
        if not expenses:
            return []

        expenses_by_id = {e.id: e for e in expenses}
        expense_ids = list(expenses_by_id.keys())

        # 3. Splits de esos gastos
        splits = list(
            self.payment_repo.session.exec(
                select(ExpenseSplit).where(
                    col(ExpenseSplit.expense_id).in_(expense_ids),
                    ExpenseSplit.deleted_at.is_(None),
                )
            ).all()
        )
        if not splits:
            return []

        splits_by_id = {s.id: s for s in splits}
        split_ids = list(splits_by_id.keys())

        # 4. Pagos en estado PENDING_CONFIRMATION
        payments = list(
            self.payment_repo.session.exec(
                select(Payment)
                .where(
                    col(Payment.split_id).in_(split_ids),
                    Payment.status == PaymentStatus.PENDING_CONFIRMATION,
                    Payment.deleted_at.is_(None),
                )
                .order_by(desc(Payment.created_at))
            ).all()
        )

        result: list[PendingVerificationPaymentRead] = []
        for p in payments:
            split = splits_by_id.get(p.split_id)
            if not split:
                continue
            expense = expenses_by_id.get(split.expense_id)
            if not expense:
                continue
            event = events_by_id.get(expense.event_id)
            event_name = event.name if event else "Evento"
            debtor_name = self.event_context.member_name(split.member_id, "Deudor")

            result.append(
                PendingVerificationPaymentRead(
                    payment_id=p.id,
                    split_id=split.id,
                    expense_id=expense.id,
                    expense_name=expense.name,
                    event_id=expense.event_id,
                    event_name=event_name,
                    debtor_name=debtor_name,
                    amount=split.assigned_amount,
                    payment_method=p.payment_method,
                    created_at=p.created_at,
                )
            )

        return result

