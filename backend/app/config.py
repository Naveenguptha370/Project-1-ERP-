"""Backward-compatible import path for the SQLite-only application settings."""

from app.core.config import Settings, settings

__all__ = ["Settings", "settings"]
