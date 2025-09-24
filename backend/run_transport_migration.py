"""
Run the transport approval table migration
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
import sqlalchemy as sa

def create_transport_approval_table():
    """Create the transport_approval_request table"""
    try:
        print("Creating transport_approval_request table...")
        
        # Check if table already exists
        inspector = sa.inspect(db.engine)
        if 'transport_approval_request' in inspector.get_table_names():
            print("✓ transport_approval_request table already exists")
            return True
        
        # Create the table
        with db.engine.connect() as connection:
            connection.execute(sa.text("""
                CREATE TABLE transport_approval_request (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sales_order_id INT NOT NULL,
                    delivery_type VARCHAR(50) NOT NULL,
                    original_transport_cost FLOAT DEFAULT 0.0,
                    requested_transport_cost FLOAT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    transport_notes TEXT NULL,
                    demand_amount FLOAT NULL,
                    approved_by VARCHAR(100) NULL,
                    created_at DATETIME NULL,
                    updated_at DATETIME NULL,
                    FOREIGN KEY (sales_order_id) REFERENCES sales_order(id)
                )
            """))
            connection.commit()
        
        print("✓ transport_approval_request table created successfully!")
        
        # Also update sales_order table to include pending_transport_approval status if needed
        print("Checking sales_order table status enum...")
        
        # Check current enum values
        with db.engine.connect() as connection:
            result = connection.execute(sa.text("""
                SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'sales_order' 
                AND COLUMN_NAME = 'order_status'
            """))
            column_info = result.fetchone()
        
        if column_info and 'pending_transport_approval' not in column_info[0]:
            print("Adding 'pending_transport_approval' to order_status enum...")
            
            # First, update any invalid order statuses to 'pending'
            with db.engine.connect() as connection:
                connection.execute(sa.text("""
                    UPDATE sales_order 
                    SET order_status = 'pending' 
                    WHERE order_status NOT IN ('pending', 'confirmed', 'delivered', 'cancelled')
                """))
                connection.commit()
            
            # Now update the enum
            with db.engine.connect() as connection:
                connection.execute(sa.text("""
                    ALTER TABLE sales_order 
                    MODIFY COLUMN order_status 
                    ENUM('pending', 'confirmed', 'pending_transport_approval', 'delivered', 'cancelled') 
                    DEFAULT 'pending'
                """))
                connection.commit()
            print("✓ order_status enum updated!")
        else:
            print("✓ order_status enum already includes 'pending_transport_approval'")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating transport approval table: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("TRANSPORT APPROVAL TABLE MIGRATION")
    print("=" * 50)
    
    app = create_app()
    
    with app.app_context():
        if create_transport_approval_table():
            print("\n✅ Transport approval table migration completed successfully!")
            print("✅ Your transport approval workflow is now ready!")
        else:
            print("\n❌ Migration failed!")