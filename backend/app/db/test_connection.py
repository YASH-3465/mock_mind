from sqlalchemy import text

from app.db.database import engine


try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        print("✅ Connected to PostgreSQL")
except Exception as e:
    print(e)