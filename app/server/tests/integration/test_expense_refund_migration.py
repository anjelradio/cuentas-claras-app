import importlib.util
from pathlib import Path

from unittest.mock import patch


def load_migration():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "f4a5b6c7d8e9_add_expense_refund_and_payer_participation.py"
    spec = importlib.util.spec_from_file_location("expense_refund_migration", path)
    assert spec and spec.loader
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def test_upgrade_backfills_refund_and_soft_deletes_legacy_debts():
    migration = load_migration()

    with patch.object(migration.op, "add_column") as add_column, patch.object(
        migration.op, "execute"
    ) as execute, patch.object(migration.op, "alter_column") as alter_column, patch.object(
        migration.op, "create_check_constraint"
    ) as check:
        migration.upgrade()

    assert [call.args[0] for call in add_column.call_args_list] == ["expense", "expense"]
    sql = "\n".join(call.args[0] for call in execute.call_args_list)
    assert "SET payer_participated = EXISTS" in sql
    assert "UPDATE expensesplit" in sql
    assert "deleted_at = CURRENT_TIMESTAMP" in sql
    assert "SUM(expensesplit.assigned_amount)" in sql
    assert alter_column.call_count == 2
    assert check.call_args.args[0] == "chk_expense_refund_amount_range"


def test_downgrade_only_removes_schema_objects():
    migration = load_migration()

    with patch.object(migration.op, "drop_constraint") as drop, patch.object(
        migration.op, "drop_column"
    ) as column:
        migration.downgrade()

    drop.assert_called_once_with("chk_expense_refund_amount_range", "expense", type_="check")
    assert [call.args[0] for call in column.call_args_list] == ["expense", "expense"]
