from models.user import db
from app import app
import traceback

with app.app_context():
    try:
        db.create_all()
        print('Database tables created successfully.')
    except Exception as e:
        with open('init_db_error.log', 'w') as f:
            f.write(traceback.format_exc())
        print('Error occurred. See init_db_error.log for details.')