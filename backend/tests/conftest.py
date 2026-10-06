import os
import sys

import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.core.security import create_access_token, get_password_hash
from app.database import Base, get_db
from app.main import app
from app.models.user import Role, User
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# In-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed permissions and test admin
    admin = session.query(User).filter(User.username == "test_admin").first()
    if not admin:
        admin_role = Role(name="Admin", description="Full Access")
        session.add(admin_role)
        session.flush()

        admin = User(
            email="admin@test.com",
            username="test_admin",
            full_name="Test Administrator",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=True,
            roles=[admin_role]
        )
        session.add(admin)
        session.commit()

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers():
    token = create_access_token(data={"sub": "test_admin"})
    return {"Authorization": f"Bearer {token}"}
