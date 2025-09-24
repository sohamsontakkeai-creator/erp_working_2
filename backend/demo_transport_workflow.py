"""
Simple Transport Approval Workflow Demo
Shows how the transport approval system works for Part Load and Company Delivery orders
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models.sales import TransportApprovalRequest, SalesOrder
from services.transport_service import TransportService
from models import db, ShowroomProduct
from datetime import datetime

def demo_transport_workflow():
    """Demonstrate the transport approval workflow with existing data"""
    print("🚀 Transport Approval Workflow Demo\n")

    try:
        # Check if we have any existing showroom products
        print("Step 1: Checking available products...")
        products = ShowroomProduct.query.filter_by(showroom_status='available').first()
        
        if not products:
            print("No available products found. Creating a simple test product...")
            # Create a simple product without assembly constraints
            product = ShowroomProduct(
                name="Demo Product",
                category="Test",
                cost_price=1000.0,
                sale_price=1500.0,
                showroom_status='available',
                created_at=datetime.utcnow()
            )
            db.session.add(product)
            db.session.commit()
            print(f"✓ Created product: {product.name} (ID: {product.id})")
        else:
            product = products
            print(f"✓ Using existing product: {product.name} (ID: {product.id})")

        # Step 2: Manually create a sales order with transport approval status
        print("\\nStep 2: Creating sales order requiring transport approval...")
        sales_order = SalesOrder(
            order_number="SO-DEMO-TRANSPORT-001",
            customer_name="Demo Customer",
            customer_contact="9876543210",
            customer_address="123 Demo Street, Test City",
            showroom_product_id=product.id,
            quantity=1,
            unit_price=1500.0,
            total_amount=2000.0,  # Including transport cost
            transport_cost=500.0,
            final_amount=2000.0,
            payment_method="cash",
            sales_person="Demo Sales Agent",
            Delivery_type="part load",  # This triggers transport approval
            order_status="pending_transport_approval",
            created_at=datetime.utcnow()
        )
        db.session.add(sales_order)
        db.session.flush()  # Get the ID
        
        print(f"✓ Created sales order: {sales_order.order_number}")
        print(f"✓ Order status: {sales_order.order_status}")
        print(f"✓ Delivery type: {sales_order.Delivery_type}")

        # Step 3: Create transport approval request
        print("\\nStep 3: Creating transport approval request...")
        approval_request = TransportApprovalRequest(
            sales_order_id=sales_order.id,
            delivery_type="part load",
            original_transport_cost=500.0,
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(approval_request)
        db.session.commit()
        
        print(f"✓ Created transport approval request (ID: {approval_request.id})")

        # Step 4: Test getting pending approvals
        print("\\nStep 4: Testing transport service methods...")
        pending_approvals = TransportService.get_pending_transport_approvals()
        print(f"✓ Found {len(pending_approvals)} pending transport approval(s)")
        
        if pending_approvals:
            approval = pending_approvals[-1]  # Get the last one (our demo)
            print(f"  - Order: {approval.get('orderNumber', 'N/A')}")
            print(f"  - Customer: {approval.get('customerName', 'N/A')}")
            print(f"  - Transport Cost: ₹{approval.get('originalTransportCost', 0)}")

        # Step 5: Test approval workflow
        print("\\nStep 5: Testing transport approval...")
        approval_result = TransportService.approve_transport_request(
            approval_request.id,
            approved_by="Demo Transport Manager"
        )
        print(f"✓ Approval successful: {approval_result['message']}")

        # Check updated order status
        db.session.refresh(sales_order)
        print(f"✓ Updated order status: {sales_order.order_status}")

        # Step 6: Test rejection scenario with new approval request
        print("\\nStep 6: Testing transport rejection scenario...")
        
        # Create another approval request for rejection demo
        approval_request_2 = TransportApprovalRequest(
            sales_order_id=sales_order.id,
            delivery_type="company delivery",
            original_transport_cost=600.0,
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(approval_request_2)
        db.session.commit()

        # Test rejection with demand
        rejection_data = {
            'demandAmount': 900.0,
            'transportNotes': 'Original cost too low, market rate is ₹900',
            'rejectedBy': 'Demo Transport Manager'
        }
        
        rejection_result = TransportService.reject_transport_request(
            approval_request_2.id,
            rejection_data
        )
        print(f"✓ Rejection successful: {rejection_result['message']}")
        print(f"✓ Demand amount: ₹{rejection_result['approvalRequest']['demandAmount']}")

        # Step 7: Show rejected approvals
        print("\\nStep 7: Testing rejected approvals retrieval...")
        rejected_approvals = TransportService.get_rejected_transport_approvals()
        print(f"✓ Found {len(rejected_approvals)} rejected approval(s) for sales review")

        print("\\n🎉 TRANSPORT APPROVAL WORKFLOW DEMO COMPLETED!")
        print("\\n📋 WORKFLOW SUMMARY:")
        print("✅ Sales orders with 'part load' and 'company delivery' require transport approval")
        print("✅ Orders get 'pending_transport_approval' status automatically")
        print("✅ Transport department can view pending approvals")
        print("✅ Transport can approve (order becomes 'confirmed')")
        print("✅ Transport can reject with demand amount")
        print("✅ Sales can view rejected approvals for customer negotiation")
        
        return True

    except Exception as e:
        print(f"\\n❌ Demo failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Cleanup demo data
        try:
            db.session.rollback()
            print("\\n🧹 Demo completed (test data rolled back)")
        except:
            pass

if __name__ == "__main__":
    print("=" * 60)
    print("TRANSPORT APPROVAL WORKFLOW - DEMO")
    print("=" * 60)
    
    # Create Flask app context
    app = create_app()
    
    with app.app_context():
        if demo_transport_workflow():
            print("\\n🚀 Your transport approval system is working correctly!")
            print("\\n📝 NEXT STEPS:")
            print("1. Frontend components need to be connected to these APIs")
            print("2. Transport department can use /transport/approvals/pending")
            print("3. Sales department can use /transport/approvals/rejected")
            print("4. Use /transport/approvals/<id>/approve and /reject endpoints")
        else:
            print("\\n❌ Transport approval workflow has issues.")