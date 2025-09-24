"""Add transport approval table for part load and company delivery orders

Revision ID: transport_approval_001
Revises: 
Create Date: 2024-12-20 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'transport_approval_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create transport_approval_request table
    op.create_table('transport_approval_request',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sales_order_id', sa.Integer(), nullable=False),
        sa.Column('delivery_type', sa.String(length=50), nullable=False),
        sa.Column('original_transport_cost', sa.Float(), default=0.0),
        sa.Column('requested_transport_cost', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=20), default='pending'),
        sa.Column('transport_notes', sa.Text(), nullable=True),
        sa.Column('demand_amount', sa.Float(), nullable=True),
        sa.Column('approved_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['sales_order_id'], ['sales_order.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Drop transport_approval_request table
    op.drop_table('transport_approval_request')