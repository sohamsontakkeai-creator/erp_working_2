"""
Authentication Routes Module
API endpoints for user authentication (login, registration)
"""
from flask import Blueprint, request, jsonify
from models.user import User, UserStatus, db
from werkzeug.security import check_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """Register a new user with pending status"""
    try:
        data = request.get_json() or {}
        
        # Validate required fields
        required_fields = ['full_name', 'email', 'username', 'password', 'department']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 409
        
        # Create new user with pending status
        new_user = User(
            full_name=data['full_name'],
            email=data['email'],
            username=data['username'],
            department=data['department'],
            status=UserStatus.PENDING
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful! Your account is pending approval.',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """Authenticate a user using either username or email and return user data"""
    try:
        data = request.get_json() or {}
        
        # Validate required fields
        if ('username' not in data and 'email' not in data) or 'password' not in data:
            return jsonify({'error': 'Username/Email and password are required'}), 400
        
        # Find user by username or email
        if 'username' in data:
            user = User.query.filter_by(username=data['username']).first()
        else:
            user = User.query.filter_by(email=data['email']).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if user is approved
        if user.status != UserStatus.APPROVED:
            return jsonify({'error': 'Your account is pending approval', 'status': user.status.value}), 403
        
        # Return user data
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/pending-users', methods=['GET'])
def get_pending_users():
    """Get all users with pending status (admin only)"""
    try:
        # TODO: Add admin authentication check
        
        pending_users = User.query.filter_by(status=UserStatus.PENDING).all()
        return jsonify([user.to_dict() for user in pending_users]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/approve-user/<int:user_id>', methods=['PUT'])
def approve_user(user_id):
    """Approve a pending user (admin only)"""
    try:
        # TODO: Add admin authentication check
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.status != UserStatus.PENDING:
            return jsonify({'error': 'User is not in pending status'}), 400
        
        user.status = UserStatus.APPROVED
        db.session.commit()
        
        return jsonify({
            'message': 'User approved successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/reject-user/<int:user_id>', methods=['PUT'])
def reject_user(user_id):
    """Reject a pending user (admin only)"""
    try:
        # TODO: Add admin authentication check
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.status != UserStatus.PENDING:
            return jsonify({'error': 'User is not in pending status'}), 400
        
        user.status = UserStatus.REJECTED
        db.session.commit()
        
        return jsonify({
            'message': 'User rejected successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/users', methods=['GET'])
def get_all_users():
    """Get all users (admin only)"""
    try:
        # TODO: Add admin authentication check
        
        users = User.query.all()
        return jsonify([user.to_dict() for user in users]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/users/<int:user_id>/department', methods=['PUT'])
def update_user_department(user_id):
    """Update user's department (admin only)"""
    try:
        # TODO: Add admin authentication check
        
        data = request.get_json() or {}
        
        if 'department' not in data:
            return jsonify({'error': 'Department is required'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.department = data['department']
        db.session.commit()
        
        return jsonify({
            'message': 'User department updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user from the system (admin only)"""
    try:
        # TODO: Add admin authentication check
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent admin from deleting themselves
        if user.department == 'admin':
            return jsonify({'error': 'Cannot delete admin user'}), 400
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500