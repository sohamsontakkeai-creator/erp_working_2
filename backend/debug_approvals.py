#!/usr/bin/env python3
"""
Debug script to check approval requests in database
"""
from models import db, ApprovalRequest, SalesOrder
from app import create_app

def debug_approvals():
    app = create_app()
    with app.app_context():
        # Check all approval requests
        requests = ApprovalRequest.query.all()
        print(f'Total approval requests in database: {len(requests)}')
        
        for r in requests:
            print(f'ID: {r.id}, Order: {r.sales_order_id}, Status: {r.status}, Type: {r.request_type}, Coupon: {r.coupon_code}')
        
        # Check pending requests specifically
        pending = ApprovalRequest.query.filter_by(status='pending').all()
        print(f'\nPending approval requests: {len(pending)}')
        
        # Check sales orders with coupon codes
        orders_with_coupons = SalesOrder.query.filter(SalesOrder.coupon_code.isnot(None)).all()
        print(f'\nSales orders with coupon codes: {len(orders_with_coupons)}')
        
        for order in orders_with_coupons:
            print(f'Order ID: {order.id}, Number: {order.order_number}, Coupon: {order.coupon_code}, Bypass: {order.finance_bypass}')

if __name__ == '__main__':
    debug_approvals()
