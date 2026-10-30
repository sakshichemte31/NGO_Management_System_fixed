from tests.conftest import make_user

EV = {"title": "TEST Health Camp", "eventType": "Outreach", "startsAt": "2027-03-01T10:00:00Z", "location": "Pune",
      "organizer": "Team A", "capacity": 2, "budget": 25000}


def test_event_crud_and_stats(login):
    c = login("Staff")
    assert c.post("/api/events", json={**EV, "capacity": 0}).status_code == 422
    assert c.post("/api/events", json={**EV, "eventType": "Party"}).status_code == 422
    assert c.post("/api/events", json={**EV, "endsAt": "2027-02-01T10:00:00Z"}).status_code == 422
    e = c.post("/api/events", json=EV).get_json()
    assert e["status"] == "Scheduled" and e["registered"] == 0 and e["budget"] == 25000
    assert c.get(f"/api/events?search=TEST Health").get_json()["total"] >= 1
    assert c.get("/api/events/stats").get_json()["total"] >= 1
    upd = c.patch(f"/api/events/{e['id']}", json={"location": "Mumbai"}).get_json()
    assert upd["location"] == "Mumbai"
    assert c.delete(f"/api/events/{e['id']}").status_code == 204
    assert c.get(f"/api/events/{e['id']}").status_code == 404


def test_registration_capacity_and_attendance(login):
    c = login("Admin")
    e = c.post("/api/events", json={**EV, "title": "TEST Capacity"}).get_json()
    eid = e["id"]
    people = []
    for _ in range(3):
        email = make_user("Staff")
        people.append(c.get(f"/api/events/people?type=user&search={email}").get_json()["items"][0]["id"])
    r1 = c.post(f"/api/events/{eid}/registrations", json={"personType": "user", "personId": people[0]})
    assert r1.status_code == 201 and r1.get_json()["name"]
    assert c.post(f"/api/events/{eid}/registrations", json={"personType": "user", "personId": people[0]}).status_code == 409
    assert c.post(f"/api/events/{eid}/registrations", json={"personType": "user", "personId": people[1]}).status_code == 201
    assert c.post(f"/api/events/{eid}/registrations", json={"personType": "user", "personId": people[2]}).status_code == 409  # full
    assert c.patch(f"/api/events/{eid}", json={"capacity": 1}).status_code == 409
    assert c.get(f"/api/events/{eid}").get_json()["registered"] == 2
    reg = r1.get_json()["id"]
    assert c.patch(f"/api/event-registrations/{reg}", json={"attendanceStatus": "Attended"}).get_json()["attendanceStatus"] == "Attended"
    assert c.delete(f"/api/events/{eid}").status_code == 409  # has registrations
    # cancelling the event cancels registrations and closes sign-up
    assert c.patch(f"/api/events/{eid}", json={"status": "Cancelled"}).get_json()["status"] == "Cancelled"
    assert c.post(f"/api/events/{eid}/registrations", json={"personType": "user", "personId": people[2]}).status_code == 409
    assert c.get(f"/api/events/{eid}").get_json()["registered"] == 1  # the attended one stays
    assert c.patch(f"/api/events/{eid}", json={"status": "Completed"}).status_code == 409


def test_volunteer_blocked_and_dashboard_ok(login):
    assert login("Volunteer").post("/api/events", json=EV).status_code == 403
    c = login("Admin")
    d = c.get("/api/dashboard")
    assert d.status_code == 200 and "metrics" in d.get_json()
    assert c.get("/api/dashboard/reminders").status_code == 200
    assert c.get("/api/reports/progress").status_code == 200
    assert c.get("/api/beneficiaries").status_code == 200
    assert c.post("/api/auth/logout").status_code == 204


PNG = (b"\x89PNG\r\n\x1a\n" + b"\x00" * 32)


def test_volunteer_views_events_without_budget_and_uploads_photos(login):
    import io
    staff, vol, vol2 = login("Staff"), login("Volunteer"), login("Volunteer")
    past = staff.post("/api/events", json={**EV, "title": "TEST Held", "startsAt": "2020-01-01T10:00:00Z"}).get_json()
    future = staff.post("/api/events", json={**EV, "title": "TEST Future"}).get_json()
    listed = vol.get("/api/events?search=TEST Held").get_json()["items"][0]
    assert listed["budget"] is None and listed["registered"] is None
    assert vol.get(f"/api/events/{past['id']}/registrations").status_code == 403
    assert vol.patch(f"/api/events/{past['id']}", json={"location": "X"}).status_code == 403
    assert vol.get("/api/events/stats").get_json()["totalBudget"] is None
    send = lambda c, eid, data, name="a.png": c.post(f"/api/events/{eid}/photos", data={"photo": (io.BytesIO(data), name), "caption": "Day"},
                                                      content_type="multipart/form-data")
    assert send(vol, future["id"], PNG).status_code == 409  # event not held yet
    assert send(vol, past["id"], b"not an image").status_code == 422
    ok = send(vol, past["id"], PNG)
    assert ok.status_code == 201 and ok.get_json()["canDelete"] is True
    pid = ok.get_json()["id"]
    assert vol2.get(f"/api/events/{past['id']}/photos").get_json()["total"] == 1
    assert vol2.get(f"/api/event-photos/{pid}/file").status_code == 200
    assert vol2.delete(f"/api/event-photos/{pid}").status_code == 403
    assert vol.delete(f"/api/event-photos/{pid}").status_code == 204
