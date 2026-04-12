from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    verifications = db.query(models.Proof).count()
    success = db.query(models.Proof).filter(models.Proof.result == True).count()
    success_rate = (success / verifications * 100) if verifications > 0 else 100
    
    # Check flags for alerts
    alerts = 0
    trusts = db.query(models.TrustResult).all()
    for t in trusts:
        if t.tier == "LOW" or t.composite_score < 40:
            alerts += 1

    return {
        "total_users": total_users,
        "total_verifications": verifications,
        "success_rate": round(success_rate, 1),
        "active_alerts": alerts
    }

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    res = []
    for u in users:
        trust = db.query(models.TrustResult).filter(models.TrustResult.user_id == u.id).first()
        res.append({
            "id": f"USR-{str(u.id).zfill(6)}",
            "username": u.username or u.name,
            "status": "VERIFIED" if u.is_verified else ("FLAGGED" if trust and trust.tier == "LOW" else "PENDING"),
            "lastActivity": u.created_at.strftime("%Y-%m-%d %H:%M"),
            "risk": trust.composite_score if trust else 0
        })
    return res

@router.get("/verifications")
def get_verifications(db: Session = Depends(get_db)):
    proofs = db.query(models.Proof).order_by(models.Proof.created_at.desc()).all()
    res = []
    for p in proofs:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()
        res.append({
            "id": f"VER-{p.id}",
            "user": user.username if user else "Unknown",
            "matchScore": 95.0 if p.result else 35.0,
            "status": "APPROVED" if p.result else "REJECTED",
            "time": p.created_at.strftime("%H:%M %p")
        })
    return res

@router.get("/logs")
def get_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.ts.desc()).limit(50).all()
    return logs
