from app.database import SessionLocal
from app.models.admin import Admin
from app.schemas.admin import AdminResponse

db = SessionLocal()
admin = db.query(Admin).filter_by(username="superadmin").first()
print("Admin fetched:", admin.username, admin.email)
try:
    response = AdminResponse.model_validate(admin)
    print("Validation successful!")
except Exception as e:
    import traceback
    with open("err.txt", "w") as f:
        traceback.print_exc(file=f)
    print("Error written to err.txt")
db.close()
