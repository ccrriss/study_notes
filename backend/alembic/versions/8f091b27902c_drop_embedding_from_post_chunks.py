"""drop embedding from post_chunks

Revision ID: 8f091b27902c
Revises: 5b1faef7c619
Create Date: 2026-09-18 01:30:48.828931

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '8f091b27902c'
down_revision: Union[str, Sequence[str], None] = '5b1faef7c619'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("post_chunks", "embedding")

def downgrade() -> None:
    """Downgrade schema."""
    pass
