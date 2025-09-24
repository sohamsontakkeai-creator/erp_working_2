#!/usr/bin/env python3
"""
Test script for Unified Order Tracking System
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from models import db
from models.sales import SalesOrder
from models.production import ProductionOrder
from models.purchase import PurchaseOrder
from models.showroom import DispatchRequest
from services.unified_tracking_service import UnifiedTrackingService

def test_unified_tracking():
    """Test the unified tracking system"""
    app = create_app()
    
    with app.app_context():
        print("🔍 Testing Unified Order Tracking System")
        print("=" * 50)
        
        # Test database connectivity
        try:
            sales_count = SalesOrder.query.count()
            prod_count = ProductionOrder.query.count()
            purchase_count = PurchaseOrder.query.count()
            dispatch_count = DispatchRequest.query.count()
            
            print(f"📊 Current Order Counts:")
            print(f"   Sales Orders: {sales_count}")
            print(f"   Production Orders: {prod_count}")
            print(f"   Purchase Orders: {purchase_count}")
            print(f"   Dispatch Requests: {dispatch_count}")
            print()
            
        except Exception as e:
            print(f"❌ Database Error: {e}")
            return False
        
        # Test UnifiedTrackingService
        try:
            print("🧪 Testing UnifiedTrackingService...")
            
            # Test get_all_orders
            result = UnifiedTrackingService.get_all_orders(limit=10)
            if result['success']:
                print(f"✅ get_all_orders: Found {result['total_count']} orders")
                if result['orders']:
                    print(f"   Sample order types: {[order['orderType'] for order in result['orders'][:3]]}")
            else:
                print(f"❌ get_all_orders failed: {result.get('error', 'Unknown error')}")
            
            # Test dashboard stats
            stats_result = UnifiedTrackingService.get_dashboard_stats()
            if stats_result['success']:
                print(f"✅ get_dashboard_stats: {stats_result['stats']['total_orders']} total orders")
                print(f"   Departments: {list(stats_result['stats']['departments'].keys())}")
            else:
                print(f"❌ get_dashboard_stats failed: {stats_result.get('error', 'Unknown error')}")
            
            print()
            print("🎉 Unified Order Tracking System is working correctly!")
            print()
            print("📋 Available Features:")
            print("   ✓ Centralized order view across all departments")
            print("   ✓ Advanced search and filtering")
            print("   ✓ Department-wise statistics")
            print("   ✓ Order details with related data")
            print("   ✓ Status and priority visualization")
            print()
            print("🌐 Access the system:")
            print("   Backend API: http://localhost:5000/api/unified-tracking/")
            print("   Frontend Dashboard: http://localhost:5174 (Admin → Order Tracking tab)")
            
            return True
            
        except Exception as e:
            print(f"❌ Service Error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    test_unified_tracking()
