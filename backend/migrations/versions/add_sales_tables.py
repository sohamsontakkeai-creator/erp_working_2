"""add sales tables

Revision ID: add_sales_tables_001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_sales_tables_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create sales_order table
    op.create_table('sales_order',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_number', sa.String(length=50), nullable=False),
        sa.Column('customer_name', sa.String(length=200), nullable=False),
        sa.Column('customer_contact', sa.String(length=100), nullable=True),
        sa.Column('customer_email', sa.String(length=200), nullable=True),
        sa.Column('customer_address', sa.String(length=400), nullable=True),
        sa.Column('showroom_product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('discount_amount', sa.Float(), nullable=True),
        sa.Column('final_amount', sa.Float(), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('payment_status', sa.String(length=50), nullable=True),
        sa.Column('order_status', sa.String(length=50), nullable=True),
        sa.Column('sales_person', sa.String(length=100), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['showroom_product_id'], ['showroom_product.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_number')
    )

    # Create customer table
    op.create_table('customer',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('contact', sa.String(length=100), nullable=True),
        sa.Column('email', sa.String(length=200), nullable=True),
        sa.Column('address', sa.String(length=400), nullable=True),
        sa.Column('customer_type', sa.String(length=50), nullable=True),
        sa.Column('credit_limit', sa.Float(), nullable=True),
        sa.Column('current_balance', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create sales_transaction table
    op.create_table('sales_transaction',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sales_order_id', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['sales_order_id'], ['sales_order.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('sales_transaction')
    op.drop_table('customer')
    op.drop_table('sales_order')
