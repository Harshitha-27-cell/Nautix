"""add avatar_url column

Revision ID: 73f2659289dc
Revises: 28f5da76e986
Create Date: 2026-06-30 10:47:32.060366

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '73f2659289dc'
down_revision: Union[str, None] = '28f5da76e986'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
