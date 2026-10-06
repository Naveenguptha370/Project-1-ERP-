"""SmartERP - Database Seeding Utility"""
import os
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, Role, Permission
from app.models.audit_log import AuditLog
from app.main import seed_initial_data


def seed_database(db: Session = None):
    close_at_end = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_at_end = True

    try:
        # Permissions
        perms_data = [
            ("AUTH_LOGIN", "Login", "AUTH"),
            ("AUTH_REGISTER", "Register", "AUTH"),
            ("USER_CREATE", "Create User", "USERS"),
            ("USER_READ", "Read User", "USERS"),
            ("USER_UPDATE", "Update User", "USERS"),
            ("USER_DELETE", "Delete User", "USERS"),
            ("ROLE_CREATE", "Create Role", "ROLES"),
            ("ROLE_READ", "Read Role", "ROLES"),
            ("ROLE_UPDATE", "Update Role", "ROLES"),
            ("ROLE_DELETE", "Delete Role", "ROLES"),
            ("SALES_ALL", "Sales Access", "SALES"),
        ]
        perm_map = {}
        for code, name, module in perms_data:
            p = db.query(Permission).filter(Permission.code == code).first()
            if not p:
                p = Permission(code=code, name=name, module=module)
                db.add(p)
                db.flush()
            perm_map[code] = p

        # Roles
        admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
        if not admin_role:
            admin_role = Role(name="ADMIN", description="Administrator")
            admin_role.permissions = list(perm_map.values())
            db.add(admin_role)
            db.flush()

        manager_role = db.query(Role).filter(Role.name == "MANAGER").first()
        if not manager_role:
            manager_role = Role(name="MANAGER", description="Manager")
            db.add(manager_role)
            db.flush()

        employee_role = db.query(Role).filter(Role.name == "EMPLOYEE").first()
        if not employee_role:
            employee_role = Role(name="EMPLOYEE", description="Employee")
            db.add(employee_role)
            db.flush()

        # Users
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                email="admin@smarterp.com",
                username="admin",
                full_name="Administrator",
                hashed_password=get_password_hash("AdminPassword123!"),
                is_active=True,
                is_superuser=True,
                roles=[admin_role],
            )
            db.add(admin)
            db.flush()

        manager = db.query(User).filter(User.username == "manager").first()
        if not manager:
            manager = User(
                email="manager@smarterp.com",
                username="manager",
                full_name="Operations Manager",
                hashed_password=get_password_hash("ManagerPassword123!"),
                is_active=True,
                is_superuser=False,
                roles=[manager_role],
            )
            db.add(manager)
            db.flush()

        employee = db.query(User).filter(User.username == "employee").first()
        if not employee:
            employee = User(
                email="employee@smarterp.com",
                username="employee",
                full_name="Staff Employee",
                hashed_password=get_password_hash("EmployeePassword123!"),
                is_active=True,
                is_superuser=False,
                roles=[employee_role],
            )
            db.add(employee)
            db.flush()

        # Call general seed_initial_data
        seed_initial_data(db)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        if close_at_end:
            db.close()
