"""Add actual_delivery_date column to part_load_detail table

Revision ID: add_actual_delivery_date
Revises: None
Create Date: 2024-01-08 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_actual_delivery_date'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add actual_delivery_date column to part_load_detail table
    op.add_column('part_load_detail',
        sa.Column('actual_delivery_date', sa.DateTime(), nullable=True)
    )


def downgrade():
    # Remove actual_delivery_date column from part_load_detail table
    op.drop_column('part_load_detail', 'actual_delivery_date')