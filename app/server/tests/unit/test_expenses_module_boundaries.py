from pathlib import Path


def test_expenses_does_not_import_events_persistence_internals():
    expenses_root = Path(__file__).parents[2] / "app" / "modules" / "expenses"
    forbidden = (
        "app.modules.events.repositories",
        "app.modules.events.models",
    )

    violations = [
        str(path.relative_to(expenses_root))
        for path in expenses_root.rglob("*.py")
        if any(token in path.read_text() for token in forbidden)
    ]

    assert violations == [], f"Expenses no debe importar internos de Events: {violations}"
