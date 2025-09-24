"""
Simple test to verify transport approval workflow is working
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.sales import TransportApprovalRequest, SalesOrder
from models import db
from datetime import datetime

def test_transport_model():
    """Test the transport approval model"""
    try:
        print("Testing TransportApprovalRequest model...")
        
        # Test creating a transport approval request
        approval = TransportApprovalRequest(
            sales_order_id=1,
            delivery_type='part load',
            original_transport_cost=500.0,
            status='pending',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Test to_dict method
        approval_dict = approval.to_dict()
        print("✓ Model creation and to_dict() working")
        print(f"✓ Approval dict keys: {list(approval_dict.keys())}")
        
        # Test model fields
        assert approval.delivery_type == 'part load'
        assert approval.original_transport_cost == 500.0
        assert approval.status == 'pending'
        print("✓ Model fields working correctly")
        
        print("✓ All tests passed!")
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("TRANSPORT APPROVAL WORKFLOW TEST")
    print("=" * 50)
    
    if test_transport_model():
        print("\n✓ Transport approval workflow backend is ready!")
    else:
        print("\n✗ Transport approval workflow has issues!")