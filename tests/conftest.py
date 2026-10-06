import pytest
from app.main import app, seed_initial_data
from app.database.session import Base, engine


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure database schema and initial seed data are populated for tests."""
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield
