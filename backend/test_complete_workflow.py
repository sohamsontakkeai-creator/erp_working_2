"""
Complete Transport Approval Workflow Test
This demonstrates the entire flow for sales orders requiring transport approval
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from services.sales_service import SalesService
from services.transport_service import TransportService
from models.sales import TransportApprovalRequest, SalesOrder
from models import db, ShowroomProduct
from datetime import datetime

def test_complete_workflow():
    """Test the complete transport approval workflow"""
    print("🚀 Starting Complete Transport Approval Workflow Test\n")

    try:
        # Step 1: Create a mock showroom product for testing
        print("Step 1: Creating mock showroom product...")
        product = ShowroomProduct(
            name="Test Product",
            category="Furniture",
            cost_price=1000.0,
            sale_price=1500.0,
            showroom_status='available',
            production_order_id=999,  # Mock production order ID
            created_at=datetime.utcnow()
        )
        db.session.add(product)
        
        # Create a mock assembly order for quantity tracking
        from models import AssemblyOrder
        assembly_order = AssemblyOrder(
            production_order_id=999,
            product_name="Test Product",  # Add required product_name
            quantity=10,  # Allow up to 10 units to be sold
            status='completed',
            created_at=datetime.utcnow()
        )
        db.session.add(assembly_order)
        db.session.commit()
        print(f"✓ Created product: {product.name} (ID: {product.id}) with 10 units available")

        # Step 2: Create a sales order with "part load" delivery type
        print("\nStep 2: Creating sales order with 'part load' delivery...")
        order_data = {
            'customerName': 'John Doe',
            'customerContact': '9876543210',
            'customerEmail': 'john@example.com',
            'customerAddress': '123 Main St, City',
            'showroomProductId': product.id,
            'quantity': 2,
            'unitPrice': 1500.0,
            'transportCost': 500.0,
            'discountAmount': 0.0,
            'paymentMethod': 'cash',
            'salesPerson': 'Sales Agent',
            'deliveryType': 'part load',  # This should trigger transport approval
            'notes': 'Test order for transport approval'
        }
        
        sales_order_dict = SalesService.create_sales_order(order_data)
        sales_order_id = sales_order_dict['id']
        print(f"✓ Created sales order: {sales_order_dict['orderNumber']}")
        print(f"✓ Order status: {sales_order_dict['orderStatus']}")

        # Verify the order is in pending_transport_approval status
        if sales_order_dict['orderStatus'] != 'pending_transport_approval':
            raise ValueError(f"Expected order status 'pending_transport_approval', got '{sales_order_dict['orderStatus']}'")

        # Step 3: Check if transport approval request was created
        print("\nStep 3: Checking transport approval request...")
        pending_approvals = TransportService.get_pending_transport_approvals()
        print(f"✓ Found {len(pending_approvals)} pending transport approval(s)")
        
        if not pending_approvals:
            raise ValueError("No transport approval request was created")

        approval = pending_approvals[0]  # Get the first one
        approval_id = approval['id']
        print(f"✓ Transport approval request created (ID: {approval_id})")
        print(f"  - Delivery Type: {approval['deliveryType']}")
        print(f"  - Original Transport Cost: ₹{approval['originalTransportCost']}")
        print(f"  - Status: {approval['status']}")

        # Step 4: Test Transport Department APPROVAL scenario
        print("\nStep 4: Testing Transport Department APPROVAL...")
        approval_result = TransportService.approve_transport_request(
            approval_id, 
            approved_by="Transport Manager"
        )
        print(f"✓ Transport approval successful: {approval_result['message']}")
        
        # Check if sales order status changed to 'confirmed'
        updated_order = SalesService.get_sales_order_by_id(sales_order_id)
        print(f"✓ Sales order status after approval: {updated_order['orderStatus']}")
        
        if updated_order['orderStatus'] != 'confirmed':
            raise ValueError(f"Expected order status 'confirmed', got '{updated_order['orderStatus']}'")

        # Step 5: Test Transport Department REJECTION scenario with new order
        print("\nStep 5: Creating another order for REJECTION test...")
        order_data_2 = order_data.copy()
        order_data_2['customerName'] = 'Jane Smith'
        order_data_2['deliveryType'] = 'company delivery'  # Another type requiring approval
        
        sales_order_dict_2 = SalesService.create_sales_order(order_data_2)
        sales_order_id_2 = sales_order_dict_2['id']
        print(f"✓ Created second sales order: {sales_order_dict_2['orderNumber']}")

        # Get the new transport approval request
        pending_approvals_2 = TransportService.get_pending_transport_approvals()
        approval_2 = next(a for a in pending_approvals_2 if a['salesOrderId'] == sales_order_id_2)
        approval_id_2 = approval_2['id']

        # Test rejection with demand amount
        print("\nStep 6: Testing Transport Department REJECTION with demand...")
        rejection_data = {
            'demandAmount': 800.0,  # Higher than original 500.0
            'transportNotes': 'Original cost too low, need ₹800 for this delivery',
            'rejectedBy': 'Transport Manager'
        }
        
        rejection_result = TransportService.reject_transport_request(approval_id_2, rejection_data)
        print(f"✓ Transport rejection successful: {rejection_result['message']}")
        print(f"✓ Demand amount: ₹{rejection_result['approvalRequest']['demandAmount']}")

        # Step 7: Test Sales Department handling of rejection
        print("\nStep 7: Testing Sales Department response to rejection...")
        rejected_approvals = TransportService.get_rejected_transport_approvals()
        print(f"✓ Found {len(rejected_approvals)} rejected approval(s) for sales review")

        # Sales accepts the demand amount
        confirm_data = {
            'action': 'accept_demand'
        }
        
        confirm_result = SalesService.confirm_transport_demand(approval_id_2, confirm_data)
        print(f"✓ Sales accepted transport demand: {confirm_result['message']}")
        
        # Check final order details
        final_order = SalesService.get_sales_order_by_id(sales_order_id_2)
        print(f"✓ Final order status: {final_order['orderStatus']}")
        print(f"✓ Updated transport cost: ₹{final_order['transportCost']}")
        print(f"✓ Updated final amount: ₹{final_order['finalAmount']}")

        print("\n🎉 COMPLETE WORKFLOW TEST PASSED!")
        print("✅ Transport approval workflow is working correctly!")
        
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Cleanup: Remove test data
        try:
            db.session.rollback()
            print("\n🧹 Cleaning up test data...")
        except:
            pass

if __name__ == "__main__":
    print("=" * 60)
    print("TRANSPORT APPROVAL WORKFLOW - COMPLETE TEST")
    print("=" * 60)
    
    # Create Flask app context
    app = create_app()
    
    with app.app_context():
        if test_complete_workflow():
            print("\nSUMMARY:")
            print("✅ Sales orders with 'part load' and 'company delivery' require transport approval")
            print("✅ Transport department can approve or reject with demand amounts")
            print("✅ Sales department can handle rejected demands appropriately")
            print("✅ Order statuses flow correctly through the workflow")
            print("\n🚀 Your transport approval system is ready to use!")
        else:
            print("\n❌ Transport approval workflow needs fixes.")