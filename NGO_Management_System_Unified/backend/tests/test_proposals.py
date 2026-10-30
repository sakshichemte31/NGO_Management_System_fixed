import pytest

NEW = {"title": "TEST Clean Water", "category": "Health", "estimatedBudget": 500000, "expectedBeneficiaries": "1,000 people",
       "startDate": "2027-01-01", "endDate": "2027-12-31", "summary": "Water filters", "geography": "Pune"}


def test_requires_login(app):
    assert app.test_client().get("/api/proposals").status_code == 401


def test_volunteer_cannot_read(login):
    assert login("Volunteer").get("/api/proposals").status_code == 403


def test_only_project_manager_creates_and_only_admin_reviews(login):
    assert login("Admin").post("/api/proposals", json=NEW).status_code == 403
    assert login("Staff").post("/api/proposals", json=NEW).status_code == 403
    pm = login("Project Manager")
    pid = pm.post("/api/proposals", json={**NEW, "title": "TEST Roles"}).get_json()["id"]
    assert login("Project Manager").post(f"/api/proposals/{pid}/transition", json={"status": "Under Review"}).status_code == 403
    assert pm.post(f"/api/proposals/{pid}/transition", json={"status": "Under Review"}).status_code == 403
    assert login("Admin").post(f"/api/proposals/{pid}/transition", json={"status": "Under Review"}).status_code == 200


def test_create_validation(login):
    c = login("Project Manager")
    assert c.post("/api/proposals", json={**NEW, "title": "x"}).status_code == 422
    assert c.post("/api/proposals", json={**NEW, "estimatedBudget": -5}).status_code == 422
    assert c.post("/api/proposals", json={**NEW, "endDate": "2026-01-01"}).status_code == 422


def test_full_lifecycle_and_planning(login):
    staff, admin = login("Project Manager"), login("Admin")
    res = staff.post("/api/proposals", json=NEW)
    assert res.status_code == 201, res.get_json()
    p = res.get_json()
    assert p["status"] == "Submitted" and p["proposalCode"].startswith("PP-")
    pid = p["id"]
    # project manager cannot review
    assert staff.post(f"/api/proposals/{pid}/transition", json={"status": "Under Review"}).status_code == 403
    # invalid jump
    assert admin.post(f"/api/proposals/{pid}/transition", json={"status": "Approved"}).status_code == 409
    assert admin.post(f"/api/proposals/{pid}/transition", json={"status": "Under Review"}).status_code == 200
    r = admin.post(f"/api/proposals/{pid}/transition", json={"status": "Financial Review"})
    assert r.get_json()["status"] == "Financial Review" and r.get_json()["reviewedByName"]
    # planning is blocked until approval
    assert staff.get(f"/api/proposals/{pid}/planning").status_code == 409
    assert admin.post(f"/api/proposals/{pid}/transition", json={"status": "Approved", "notes": "Good"}).status_code == 200
    # content can no longer be edited
    assert staff.patch(f"/api/proposals/{pid}", json={"title": "TEST Changed"}).status_code == 409
    plan = staff.get(f"/api/proposals/{pid}/planning").get_json()
    assert plan["planningStatus"] == "Not Started"
    assert plan["sections"]["overview"]["projectName"] == "TEST Clean Water"  # pre-filled
    assert len(plan["departments"]) == 9
    # incomplete plan cannot be finalised
    assert admin.post(f"/api/proposals/{pid}/planning/complete").status_code == 403  # admin does not plan
    assert staff.post(f"/api/proposals/{pid}/planning/complete").status_code == 422
    assert admin.put(f"/api/proposals/{pid}/planning", json={"sections": {}}).status_code == 403
    assert staff.put(f"/api/proposals/{pid}/planning", json={"sections": {"bogus": {}}}).status_code == 422
    assert staff.put(f"/api/proposals/{pid}/planning", json={"sections": {"overview": {"nope": "x"}}}).status_code == 422
    body = {"sections": {
        "beneficiary": {"primaryBeneficiaries": "Villagers", "estimatedCount": "1000", "selectionCriteria": "Need based"},
        "impact": {"directImpact": "Clean water", "longTermOutcomes": "Health"},
        "stages": {"phase1": "Survey", "milestones": "M1", "timeline": "12 months"},
        "hr": {"teamLead": "Asha", "staffAssigned": "4", "volunteersRequired": "12"},
        "operations": {"venueSite": "Villages", "logisticsPlan": "Trucks"},
        "budget": {"personnelCosts": "100000", "operationalCosts": "50000", "fundingSources": "CSR"},
    }, "departments": {"finance": {"responsible": "Ravi", "notes": "Track"}}}
    bad = {"sections": {"hr": {"volunteersRequired": "many"}}}
    assert staff.put(f"/api/proposals/{pid}/planning", json=bad).status_code == 422
    saved = staff.put(f"/api/proposals/{pid}/planning", json=body).get_json()
    assert saved["planningStatus"] == "In Progress"
    assert next(d for d in saved["departments"] if d["id"] == "finance")["responsible"] == "Ravi"
    done = staff.post(f"/api/proposals/{pid}/planning/complete")
    assert done.status_code == 200 and done.get_json()["planningStatus"] == "Complete"
    assert any(i["id"] == pid for i in staff.get("/api/planning/proposals").get_json()["items"])
    listed = staff.get("/api/proposals?status=Approved&search=TEST Clean").get_json()
    assert listed["total"] >= 1 and listed["items"][0]["planningCompletion"] == 100
    assert listed["items"][0]["volunteersRequired"] == 12


def test_reject_requires_reason_and_reopen(login):
    staff, admin = login("Project Manager"), login("Admin")
    pid = staff.post("/api/proposals", json={**NEW, "title": "TEST Reject Me", "submit": True}).get_json()["id"]
    admin.post(f"/api/proposals/{pid}/transition", json={"status": "Under Review"})
    assert admin.post(f"/api/proposals/{pid}/transition", json={"status": "Rejected"}).status_code == 422
    r = admin.post(f"/api/proposals/{pid}/transition", json={"status": "Rejected", "notes": "Over budget"}).get_json()
    assert r["status"] == "Rejected" and r["reviewNotes"] == "Over budget"
    assert staff.post(f"/api/proposals/{pid}/transition", json={"status": "Draft"}).get_json()["status"] == "Draft"
    assert staff.patch(f"/api/proposals/{pid}", json={"title": "TEST Reject Me v2"}).status_code == 200
    assert staff.delete(f"/api/proposals/{pid}").status_code == 204
    assert staff.get(f"/api/proposals/{pid}").status_code == 404


def test_draft_save_and_bad_id(login):
    c = login("Project Manager")
    d = c.post("/api/proposals", json={**NEW, "title": "TEST Draft", "submit": False}).get_json()
    assert d["status"] == "Draft"
    assert c.get("/api/proposals/not-a-uuid").status_code == 404
    c.delete(f"/api/proposals/{d['id']}")
