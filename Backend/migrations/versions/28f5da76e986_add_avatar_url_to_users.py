"""add avatar_url to users

Revision ID: 28f5da76e986
Revises: da13611c8ce1
Create Date: 2026-06-30 10:17:41.960800
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "28f5da76e986"
down_revision: Union[str, None] = "da13611c8ce1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.String(length=512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_url")