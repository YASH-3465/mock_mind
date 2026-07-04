"""add resume_text column

Revision ID: 708e28e57709
Revises: 8333595f13d7
Create Date: 2026-07-03 22:13:06.186309

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '708e28e57709'
down_revision: Union[str, Sequence[str], None] = '8333595f13d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "resumes",
        sa.Column(
            "resume_text",
            sa.Text(),
            nullable=True
        )
    )


def downgrade() -> None:
    op.drop_column("resumes", "resume_text")
    # ### end Alembic commands ###
