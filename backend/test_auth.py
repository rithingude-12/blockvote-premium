import os
from dotenv import load_dotenv

load_dotenv()
from app.database import SessionLocal
from app.models.admin import Admin
from app.schemas.admin import AdminResponse

db = SessionLocal()
try:
    admin = db.query(Admin).filter(Admin.username == "superadmin").first()
    print("Found admin:", admin.username)
    # Attempt serialization
    response = AdminResponse.model_validate(admin)
    print("Serialization success:", response.model_dump_json())
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
