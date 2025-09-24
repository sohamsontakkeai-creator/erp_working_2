from flask import Blueprint, request, jsonify
from services.gate_entry_service import gate_entry_service

gate_entry_bp = Blueprint('gate_entry', __name__)

@gate_entry_bp.route('/gate-entry/register', methods=['POST'])
def register_user():
    data = request.get_json() or {}
    name = data.get('name')
    phone = data.get('phone')
    photo = data.get('photo')
    if not name or not phone:
        return jsonify({'success': False, 'message': 'Name and phone are required'}), 400
    result = gate_entry_service.register_user(name, phone, photo)
    return jsonify(result)

@gate_entry_bp.route('/gate-entry/users', methods=['GET'])
def get_users():
    users = gate_entry_service.get_users()
    return jsonify(users)

@gate_entry_bp.route('/gate-entry/users/<phone>', methods=['DELETE'])
def delete_user(phone):
    result = gate_entry_service.delete_user(phone)
    return jsonify(result)

@gate_entry_bp.route('/gate-entry/manual-entry', methods=['POST'])
def manual_entry():
    data = request.get_json() or {}
    phone = data.get('phone')
    details = data.get('details', '')
    if not phone:
        return jsonify({'success': False, 'message': 'Phone is required'}), 400
    result = gate_entry_service.manual_entry(phone, details)
    return jsonify(result)

@gate_entry_bp.route('/gate-entry/manual-exit', methods=['POST'])
def manual_exit():
    data = request.get_json() or {}
    phone = data.get('phone')
    details = data.get('details', '')
    if not phone:
        return jsonify({'success': False, 'message': 'Phone is required'}), 400
    result = gate_entry_service.manual_exit(phone, details)
    return jsonify(result)

@gate_entry_bp.route('/gate-entry/going-out', methods=['POST'])
def going_out():
    data = request.get_json() or {}
    phone = data.get('phone')
    reason = data.get('reason')
    details = data.get('details', '')
    if not phone or not reason:
        return jsonify({'success': False, 'message': 'Phone and reason are required'}), 400
    result = gate_entry_service.going_out(phone, reason, details)
    return jsonify(result)

@gate_entry_bp.route('/gate-entry/coming-back', methods=['POST'])
def coming_back():
    data = request.get_json() or {}
    phone = data.get('phone')
    if not phone:
        return jsonify({'success': False, 'message': 'Phone is required'}), 400
    result = gate_entry_service.coming_back(phone)
    return jsonify(result)

@gate_entry_bp.route('/gate-entry/logs', methods=['GET'])
def get_gate_logs():
    limit = request.args.get('limit', 100, type=int)
    logs = gate_entry_service.get_gate_logs(limit)
    return jsonify(logs)

@gate_entry_bp.route('/gate-entry/going-out-logs', methods=['GET'])
def get_going_out_logs():
    limit = request.args.get('limit', 100, type=int)
    logs = gate_entry_service.get_going_out_logs(limit)
    return jsonify(logs)

@gate_entry_bp.route('/gate-entry/today-logs', methods=['GET'])
def get_today_logs():
    summary = gate_entry_service.get_today_logs()
    return jsonify(summary)
