from app.db.database import Base

# Import all models here so Alembic can detect them
from app.models.user import User
from app.models.profile import Profile
from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis