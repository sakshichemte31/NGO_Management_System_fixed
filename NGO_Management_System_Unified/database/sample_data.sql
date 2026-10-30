-- Optional demo data for the Proposals, Planning and Events modules.
INSERT INTO proposals (proposal_code, title, sector, summary, status, priority, estimated_budget, expected_beneficiaries, start_date, end_date, geography) VALUES
 ('PP-2026-001', 'Mobile Health Clinics - Rural Rajasthan', 'Health', 'Weekly mobile clinics for remote villages.', 'Under Review', 'High', 1200000, '5,000 patients/year', '2026-12-01', '2027-11-30', 'Rajasthan'),
 ('PP-2026-002', 'Girls Education Scholarship Fund', 'Education', 'Scholarships and mentoring for 200 girls.', 'Approved', 'High', 650000, '200 girls/year', '2026-11-15', '2027-10-31', 'Pune, Maharashtra'),
 ('PP-2026-003', 'Urban Waste Composting', 'Environment', 'Community composting units.', 'Draft', 'Medium', 220000, '10 tonnes/month', '2027-01-10', '2027-12-31', 'Pune');
INSERT INTO events (title, description, starts_at, location, capacity, event_type, organizer, budget, status) VALUES
 ('Annual Donors Gala 2026', 'Annual fundraising evening.', '2026-11-15 18:00+05:30', 'Hotel Conrad, Pune', 300, 'Fundraiser', 'Fundraising Team', 450000, 'Scheduled'),
 ('Health Camp - Hadapsar', 'Free community health check-ups.', '2026-11-22 09:00+05:30', 'Hadapsar Community Hall', 500, 'Outreach', 'Program Team', 60000, 'Scheduled'),
 ('Board Review Meeting', 'Quarterly board review.', '2026-10-20 15:00+05:30', 'Hope Foundation HQ', 15, 'Meeting', 'Admin', 0, 'Completed');
