"""Add driver fields to vehicle table

Revision ID: add_driver_fields_to_vehicle
Revises: add_transport_cost_column
Create Date: 2025-09-16 11:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_driver_fields_to_vehicle'
down_revision = 'add_transport_cost_column'
branch_labels = None
depends_on = None


def upgrade():
    # Add driver_name and driver_contact columns to vehicle table
    op.add_column('vehicle', sa.Column('driver_name', sa.String(200), nullable=True))
    op.add_column('vehicle', sa.Column('driver_contact', sa.String(100), nullable=True))


def downgrade():
    # Remove the added columns
    op.drop_column('vehicle', 'driver_contact')
    op.drop_column('vehicle', 'driver_name')





