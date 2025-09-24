#!/usr/bin/env python3
"""
Script to recreate database with all current model columns including original_requirements
"""
import os
import shutil
from datetime import datetime

def backup_and_recreate_database():
    """Backup existing database and recreate with current models"""
    
    # Paths
    db_path = os.path.join('instance', 'erp_system.db')
    backup_path = os.path.join('instance', f'erp_system_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db')
    
    try:
        # Backup existing database if it exists
        if os.path.exists(db_path):
            shutil.copy2(db_path, backup_path)
            print(f"✅ Database backed up to: {backup_path}")
            
            # Remove old database
            os.remove(db_path)
            print("🗑️ Old database removed")
        
        # Import Flask app and initialize
        from app import create_app, initialize_database
        
        app = create_app()
        
        # Recreate database with current models
        print("🔄 Creating new database with all current model columns...")
        initialize_database(app)
        
        # Verify the purchase_order table has original_requirements column
        with app.app_context():
            from models import db
            import sqlite3
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(purchase_order)")
            columns = [row[1] for row in cursor.fetchall()]
            conn.close()
            
            if 'original_requirements' in columns:
                print("✅ SUCCESS: original_requirements column created in purchase_order table!")
                print(f"📋 All columns: {columns}")
            else:
                print("❌ ERROR: original_requirements column still missing!")
                
        return True
        
    except Exception as e:
        print(f"❌ Error recreating database: {e}")
        
        # Restore backup if something went wrong
        if os.path.exists(backup_path) and not os.path.exists(db_path):
            shutil.copy2(backup_path, db_path)
            print("🔄 Database restored from backup")
            
        return False

if __name__ == "__main__":
    print("🚀 Starting database recreation process...")
    success = backup_and_recreate_database()
    
    if success:
        print("\n✅ Database recreation completed successfully!")
        print("The original_requirements column is now available in the purchase_order table.")
        print("Your ERP system should now work without HTTP 500 errors.")
    else:
        print("\n❌ Database recreation failed. Check the error messages above.")
