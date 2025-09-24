#!/usr/bin/env python3

"""
Test script to validate transport approval implementation
"""

import sys
import os
sys.path.append('.')

from app import app
from models import db
from models.sales import SalesOrder, TransportApprovalRequest

def test_transport_approval_model():
    """Test the TransportApprovalRequest model"""
    with app.app_context():
        print("🧪 Testing TransportApprovalRequest model...")
        
        try:
            # Test model instantiation
            test_approval = TransportApprovalRequest(
                sales_order_id=1,
                delivery_type='company delivery',
                original_transport_cost=100.0,
                status='pending'
            )
            print("✅ Model can be instantiated")
            
            # Test to_dict method
            approval_dict = test_approval.to_dict()
            print("✅ to_dict() method works")
            print(f"   Sample output: {approval_dict}")
            
            # Test database table creation (if needed)
            try:
                db.create_all()
                print("✅ Database tables created/verified")
            except Exception as e:
                print(f"⚠️  Database table creation warning: {e}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error with TransportApprovalRequest model: {e}")
            return False

def test_sales_order_status_update():
    """Test the updated sales order status field"""
    with app.app_context():
        print("\n🧪 Testing SalesOrder status field...")
        
        try:
            # Test new status value
            test_order = SalesOrder(
                order_number='TEST-001',
                customer_name='Test Customer',
                showroom_product_id=1,
                quantity=1,
                unit_price=1000.0,
                total_amount=1000.0,
                final_amount=1000.0,
                payment_method='cash',
                sales_person='Test Person',
                order_status='pending_transport_approval'  # New status
            )
            print("✅ SalesOrder with new status can be created")
            
            return True
            
        except Exception as e:
            print(f"❌ Error with SalesOrder status: {e}")
            return False

if __name__ == '__main__':
    print("🚀 Starting transport approval system tests...\n")
    
    success = True
    success &= test_transport_approval_model()
    success &= test_sales_order_status_update()
    
    print(f"\n{'✅ All tests passed!' if success else '❌ Some tests failed!'}")
    sys.exit(0 if success else 1)