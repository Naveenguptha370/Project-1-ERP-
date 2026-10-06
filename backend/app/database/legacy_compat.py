from sqlalchemy import Engine, inspect, text


LEGACY_COLUMNS = {
    "permissions": {
        "name": "VARCHAR(100)",
        "module": "VARCHAR(100)",
    },
    "users": {
        "is_superuser": "BOOLEAN NOT NULL DEFAULT 0",
    },
    "audit_logs": {
        "details": "TEXT",
        "description": "TEXT",
        "entity_id": "VARCHAR(100)",
        "entity_type": "VARCHAR(50)",
        "timestamp": "DATETIME",
        "user_agent": "VARCHAR(255)",
        "user_email": "VARCHAR(255)",
    },
    "user_roles": {
        "created_at": "DATETIME",
    },
    "role_permissions": {
        "created_at": "DATETIME",
    },
}


def upgrade_legacy_sqlite_schema(engine: Engine) -> None:
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())
        for table_name, columns in LEGACY_COLUMNS.items():
            if table_name not in tables:
                continue
            existing_columns = {
                column["name"] for column in inspector.get_columns(table_name)
            }
            for column_name, definition in columns.items():
                if column_name not in existing_columns:
                    connection.exec_driver_sql(
                        f'ALTER TABLE "{table_name}" ADD COLUMN "{column_name}" {definition}'
                    )

        if "permissions" in tables:
            connection.execute(
                text(
                    "UPDATE permissions SET name = code WHERE name IS NULL"
                )
            )
            connection.execute(
                text(
                    "UPDATE permissions SET module = 'CORE' WHERE module IS NULL"
                )
            )
        if "audit_logs" in tables:
            connection.execute(
                text(
                    "UPDATE audit_logs SET timestamp = COALESCE(created_at, CURRENT_TIMESTAMP) "
                    "WHERE timestamp IS NULL"
                )
            )
