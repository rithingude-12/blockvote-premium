from app.database import SessionLocal
from app.models.admin import Admin

db = SessionLocal()
admin = db.query(Admin).filter_by(username="superadmin").first()
if admin:
    print(f"Old email: {admin.email}")
    admin.email = "admin@blockvote.com"
    db.commit()
    print("Email updated to admin@blockvote.com")
else:
    print("Superadmin not found.")
db.close()
