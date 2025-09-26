import os
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

class Config:
    """Base configuration class"""

    # Use DATABASE_URL from Render if available
    DATABASE_URL = os.getenv('postgresql://production_management_user:0Jqtexe0Ug999eTAnWasjTIGrP7qiyGY@dpg-d3b44ljuibrs73f63ba0-a/production_management')

    if DATABASE_URL:
        # PostgreSQL connection string (Render sets this automatically)
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        # Fallback for local development (PostgreSQL)
        POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
        POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'password')
        POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
        POSTGRES_DB = os.getenv('POSTGRES_DB', 'production_management')
        SQLALCHEMY_DATABASE_URI = f'postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # Flask configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # CORS configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestConfig,
    'default': DevelopmentConfig
}
