#!/usr/bin/env python3
"""
Test script to verify the payment rejection fix
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, SalesOrder, SalesTransaction
from services.finance_service import FinanceService
from services.sales_service import SalesService

def test_payment_rejection_fix():
    """Test that rejected payments are properly removed from totals"""
    app = create_app()
    with app.app_context():
        print("Testing payment rejection fix...")
        
        # Find an existing sales order or create a test scenario
        orders = SalesOrder.query.filter_by(payment_status='pending').first()
        if not orders:
            print("No pending orders found. Please create a sales order first.")
            return
            
        order_id = orders.id
        print(f"Testing with order ID: {order_id}")
        print(f"Order final amount: {orders.final_amount}")
        
        # Get initial state
        initial_data = orders.to_dict()
        print(f"Initial amount paid: {initial_data['amountPaid']}")
        print(f"Initial balance: {initial_data['balanceAmount']}")
        
        # Simulate a partial payment
        payment_amount = orders.final_amount / 2  # Pay half
        print(f"\nSimulating partial payment of: {payment_amount}")
        
        try:
            # Process payment (this sets status to pending_finance_approval)
            payment_result = SalesService.process_payment(order_id, {
                'amount': payment_amount,
                'paymentMethod': 'bank_transfer',
                'notes': 'Test partial payment'
            })
            print("Payment processed successfully")
            
            # Check state after payment
            order_after_payment = SalesOrder.query.get(order_id)
            payment_data = order_after_payment.to_dict()
            print(f"After payment - Amount paid: {payment_data['amountPaid']}")
            print(f"After payment - Balance: {payment_data['balanceAmount']}")
            print(f"After payment - Status: {payment_data['paymentStatus']}")
            
            # Now reject the payment
            print(f"\nRejecting the payment...")
            rejection_result = FinanceService.approve_sales_payment(order_id, approved=False)
            
            # Check final state
            print(f"After rejection - Amount paid: {rejection_result['amountPaid']}")
            print(f"After rejection - Balance: {rejection_result['balanceAmount']}")
            print(f"After rejection - Status: {rejection_result['paymentStatus']}")
            
            # Verify the fix
            if rejection_result['amountPaid'] == initial_data['amountPaid']:
                print("\n✅ SUCCESS: Payment amount correctly reverted after rejection!")
            else:
                print(f"\n❌ FAILED: Payment amount not reverted. Expected: {initial_data['amountPaid']}, Got: {rejection_result['amountPaid']}")
                
            if rejection_result['balanceAmount'] == initial_data['balanceAmount']:
                print("✅ SUCCESS: Balance amount correctly restored after rejection!")
            else:
                print(f"❌ FAILED: Balance not restored. Expected: {initial_data['balanceAmount']}, Got: {rejection_result['balanceAmount']}")
                
        except Exception as e:
            print(f"Error during test: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_payment_rejection_fix()