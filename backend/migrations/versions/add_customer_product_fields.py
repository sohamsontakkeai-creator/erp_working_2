"""Add customer_name and product_name to part_load_detail table

Revision ID: add_customer_product_fields
Revises: # Leave this empty, it will be filled automatically
Create Date: 2025-09-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_customer_product_fields'
down_revision = None  # This will be filled automatically
branch_labels = None
depends_on = None

def upgrade():
    # Add customer_name and product_name columns to part_load_detail table
    op.add_column('part_load_detail', sa.Column('customer_name', sa.String(200), nullable=True))
    op.add_column('part_load_detail', sa.Column('product_name', sa.String(200), nullable=True))

def downgrade():
    # Remove the columns if we need to rollback
    op.drop_column('part_load_detail', 'customer_name')
    op.drop_column('part_load_detail', 'product_name')