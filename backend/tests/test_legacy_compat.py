from sqlalchemy import create_engine, inspect

from app.database.legacy_compat import upgrade_legacy_sqlite_schema


def test_upgrade_adds_description_to_legacy_audit_logs():
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.begin() as connection:
            connection.exec_driver_sql(
                """
                CREATE TABLE audit_logs (
                    id INTEGER PRIMARY KEY,
                    action VARCHAR(100) NOT NULL,
                    created_at DATETIME
                )
                """
            )

        upgrade_legacy_sqlite_schema(engine)

        columns = {column["name"] for column in inspect(engine).get_columns("audit_logs")}
        assert "description" in columns
    finally:
        engine.dispose()
