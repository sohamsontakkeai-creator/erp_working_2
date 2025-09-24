"""Add driver details to sales order

Revision ID: add_driver_details
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_driver_details'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add driver details columns to sales_order table
    op.add_column('sales_order', sa.Column('driver_name', sa.String(100), nullable=True))
    op.add_column('sales_order', sa.Column('driver_contact', sa.String(20), nullable=True))
    op.add_column('sales_order', sa.Column('driver_license', sa.String(50), nullable=True))
    op.add_column('sales_order', sa.Column('vehicle_number', sa.String(20), nullable=True))

def downgrade():
    # Remove driver details columns from sales_order table
    op.drop_column('sales_order', 'vehicle_number')
    op.drop_column('sales_order', 'driver_license')
    op.drop_column('sales_order', 'driver_contact')
    op.drop_column('sales_order', 'driver_name')