"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-28

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password", sa.String(), nullable=False),
        sa.Column("firstName", sa.String(), nullable=False),
        sa.Column("lastName", sa.String(), nullable=False),
        sa.Column("avatar", sa.String(), nullable=True),
        sa.Column("role", sa.String(), nullable=False, server_default="STUDENT"),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.Column("updatedAt", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_stats",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.Column("totalXp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("totalSessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("averageScore", sa.Float(), nullable=False, server_default="0"),
        sa.Column("averageTime", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("currentStreak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lastActivityAt", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["userId"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_stats_id", "user_stats", ["id"], unique=False)
    op.create_index("ix_user_stats_userId", "user_stats", ["userId"], unique=True)

    op.create_table(
        "training_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("userId", sa.Integer(), nullable=False),
        sa.Column("difficulty", sa.String(), nullable=False),
        sa.Column("precision", sa.Float(), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=False),
        sa.Column("totalImages", sa.Integer(), nullable=False),
        sa.Column("correctAnswers", sa.Integer(), nullable=False),
        sa.Column("baseScore", sa.Integer(), nullable=False),
        sa.Column("multiplier", sa.Float(), nullable=False),
        sa.Column("xpEarned", sa.Integer(), nullable=False),
        sa.Column("completedAt", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["userId"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_training_sessions_id", "training_sessions", ["id"], unique=False)
    op.create_index("ix_training_sessions_userId", "training_sessions", ["userId"], unique=False)
    op.create_index("ix_training_sessions_completedAt", "training_sessions", ["completedAt"], unique=False)


def downgrade() -> None:
    op.drop_table("training_sessions")
    op.drop_table("user_stats")
    op.drop_table("users")
