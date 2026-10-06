import sys
from getpass import getpass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.database.base  # noqa: F401 - register every model before metadata use
from app.core.config import settings
from app.database import Base, SessionLocal, engine
from app.database.legacy_compat import upgrade_legacy_sqlite_schema
from app.routers.auth import seed_default_roles_and_admin


def main() -> None:
    if not settings.ADMIN_EMAIL:
        raise SystemExit("Set ADMIN_EMAIL in backend/.env before bootstrapping.")
    if not settings.ADMIN_PASSWORD or len(settings.ADMIN_PASSWORD) < 12:
        print("ADMIN_PASSWORD is missing or too short. Choose a new password (12+ characters).")
        password = getpass("New administrator password: ")
        confirmation = getpass("Confirm administrator password: ")
        if password != confirmation:
            raise SystemExit("Passwords do not match; administrator was not changed.")
        if len(password) < 12:
            raise SystemExit("Password must contain at least 12 characters; administrator was not changed.")
        settings.ADMIN_PASSWORD = password
    upgrade_legacy_sqlite_schema(engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_default_roles_and_admin(db)
    print(f"Administrator '{settings.ADMIN_USERNAME}' is ready.")


if __name__ == "__main__":
    main()
