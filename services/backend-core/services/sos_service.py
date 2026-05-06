"""
MindTrace AI+ — SOS Emergency Service
=======================================
Mocked SMTP/SendGrid email dispatch to emergency contacts.
Structured so swapping to real aiosmtplib/SendGrid is a one-line change.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from models.schemas import TriggerSOSRequest, TriggerSOSResponse
from database.db import get_database, Collections

logger = logging.getLogger("mindtrace.services.sos")


async def trigger_sos(req: TriggerSOSRequest) -> TriggerSOSResponse:
    """Send emergency notifications to all contacts (mocked for MVP)."""
    notifications = []
    for contact in req.contacts:
        # --- MOCK: In production, replace with aiosmtplib or SendGrid async call ---
        notification = {
            "to": contact.email,
            "name": contact.name,
            "relationship": contact.relationship,
            "status": "sent",
            "method": "email_mock",
            "subject": f"🚨 MindTrace Alert: {req.user_name} may need support",
            "body": (
                f"Hi {contact.name},\n\n"
                f"{req.user_name} is going through a difficult time. "
                f"Their current wellness score is {req.wellness_index}/100 "
                f"(detected emotion: {req.emotion}).\n\n"
                f"{'Message: ' + req.message if req.message else ''}\n\n"
                f"Please reach out to them when you can.\n\n"
                f"— MindTrace AI+ Safety System"
            ),
        }
        notifications.append(notification)
        logger.warning("🚨 SOS MOCK sent to %s <%s> for user %s", contact.name, contact.email, req.user_name)

    # Persist SOS event
    db = await get_database()
    await db[Collections.SOS_CONTACTS].update_one(
        {"user_id": req.user_id},
        {"$set": {
            "contacts": [c.model_dump() for c in req.contacts],
            "last_triggered_at": datetime.now(timezone.utc).isoformat(),
        },
         "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )

    return TriggerSOSResponse(
        success=True,
        contacts_notified=len(notifications),
        notifications=notifications,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
