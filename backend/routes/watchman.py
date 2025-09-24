"""
Watchman Routes Module
API endpoints for watchman operations (gate security)
"""
from flask import Blueprint, request, jsonify
from services.watchman_service import WatchmanService

watchman_bp = Blueprint('watchman', __name__)


@watchman_bp.route('/watchman/pending-pickups', methods=['GET'])
def get_pending_pickups():
    """Get all pending customer pickups waiting for verification"""
    try:
        pickups = WatchmanService.get_pending_pickups()
        return jsonify(pickups), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@watchman_bp.route('/watchman/gate-passes', methods=['GET'])
def get_all_gate_passes():
    """Get all gate passes (completed and pending)"""
    try:
        passes = WatchmanService.get_all_gate_passes()
        return jsonify(passes), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@watchman_bp.route('/watchman/verify/<int:gate_pass_id>', methods=['POST'])
def verify_customer_pickup(gate_pass_id):
    """Verify customer identity and complete pickup or send in"""
    try:
        data = request.get_json() or {}
        action = data.get('action', 'release')  # Default to 'release' for backward compatibility
        result = WatchmanService.verify_customer_identity(gate_pass_id, data, action)

        # Handle identity mismatch case
        if result.get('status') == 'identity_mismatch':
            return jsonify(result), 409  # Conflict status code

        return jsonify(result), 200

    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@watchman_bp.route('/watchman/reject/<int:gate_pass_id>', methods=['POST'])
def reject_customer_pickup(gate_pass_id):
    """Reject customer pickup for security reasons"""
    try:
        data = request.get_json() or {}
        rejection_reason = data.get('rejectionReason', 'No reason provided')
        
        result = WatchmanService.reject_pickup(gate_pass_id, rejection_reason)
        return jsonify(result), 200
        
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@watchman_bp.route('/watchman/summary', methods=['GET'])
def get_daily_summary():
    """Get daily summary of watchman activities"""
    try:
        summary = WatchmanService.get_daily_summary()
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@watchman_bp.route('/watchman/search', methods=['GET'])
def search_gate_passes():
    """Search gate passes by customer name, order number, or vehicle number"""
    try:
        search_term = request.args.get('q', '').strip()
        if not search_term:
            return jsonify({'error': 'Search term is required'}), 400
        
        results = WatchmanService.search_gate_pass(search_term)
        return jsonify({
            'searchTerm': search_term,
            'results': results,
            'count': len(results)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
