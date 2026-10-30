-- Optional demo projects (with tasks, budget, expenses, impact, checklists, team, partners) so the
-- Project Reports page has data. Loaded by `flask --app wsgi seed-demo` when no projects exist.
INSERT INTO projects (project_code, name, sector, summary, status, current_stage, progress, start_date, end_date, active_since) VALUES
 ('PRJ-2026-001', 'Gyan Jyoti - Rural Learning Centres', 'Education', 'After-school learning centres in 12 villages.', 'Active', 3, 55, '2026-04-01', '2027-03-31', '2026-04-01'),
 ('PRJ-2026-002', 'Swasthya Setu - Mobile Health Camps', 'Health', 'Monthly mobile health camps for remote hamlets.', 'Active', 2, 35, '2026-06-01', '2027-05-31', '2026-06-01'),
 ('PRJ-2026-003', 'Harit Pune - Community Composting', 'Environment', 'Neighbourhood composting units.', 'Upcoming', 1, 10, '2027-01-10', '2027-12-31', NULL);

INSERT INTO project_tasks (project_id, title, status, priority, due_date, stage)
SELECT p.id, t.title, t.status, t.priority, t.due_date::date, t.stage FROM projects p JOIN (VALUES
 ('PRJ-2026-001', 'Recruit centre facilitators', 'Done', 'High', '2026-05-15', 1),
 ('PRJ-2026-001', 'Procure learning kits', 'Done', 'Medium', '2026-06-30', 2),
 ('PRJ-2026-001', 'Mid-term assessment', 'In Progress', 'High', '2026-11-30', 3),
 ('PRJ-2026-002', 'Doctor roster for camps', 'Done', 'High', '2026-06-20', 1),
 ('PRJ-2026-002', 'Medicine stock procurement', 'In Progress', 'Critical', '2026-11-10', 2),
 ('PRJ-2026-003', 'Site survey of 5 societies', 'To Do', 'Medium', '2026-12-15', 1)
) AS t(code, title, status, priority, due_date, stage) ON p.project_code = t.code;

INSERT INTO project_budget_items (project_id, section, item_name, quantity, unit_cost)
SELECT p.id, b.section, b.item_name, b.quantity, b.unit_cost FROM projects p JOIN (VALUES
 ('PRJ-2026-001', 'Salaries', 'Facilitators (12 months)', 12, 60000),
 ('PRJ-2026-001', 'Operations', 'Learning material', 12, 15000),
 ('PRJ-2026-001', 'Assets', 'Tablets', 20, 9000),
 ('PRJ-2026-002', 'Salaries', 'Medical staff', 12, 80000),
 ('PRJ-2026-002', 'Operations', 'Medicines and consumables', 12, 40000),
 ('PRJ-2026-002', 'Assets', 'Diagnostic equipment', 4, 45000),
 ('PRJ-2026-003', 'Operations', 'Compost bins and bio-culture', 50, 2500)
) AS b(code, section, item_name, quantity, unit_cost) ON p.project_code = b.code;

INSERT INTO project_expenses (project_id, expense_date, section, head, amount, paid_to)
SELECT p.id, e.expense_date::date, e.section, e.head, e.amount, e.paid_to FROM projects p JOIN (VALUES
 ('PRJ-2026-001', '2026-07-31', 'Salaries', 'Facilitator salaries', 240000, 'Facilitators'),
 ('PRJ-2026-001', '2026-08-12', 'Operations', 'Learning kits', 45000, 'EduSupplies Pvt Ltd'),
 ('PRJ-2026-001', '2026-09-05', 'Assets', 'Tablets', 90000, 'TechMart'),
 ('PRJ-2026-002', '2026-08-31', 'Salaries', 'Medical staff', 160000, 'Medical team'),
 ('PRJ-2026-002', '2026-09-18', 'Operations', 'Medicines', 70000, 'Jan Aushadhi Store')
) AS e(code, expense_date, section, head, amount, paid_to) ON p.project_code = e.code;

INSERT INTO impact_indicators (project_id, name, category, unit, target, current_value)
SELECT p.id, i.name, i.category, i.unit, i.target, i.current_value FROM projects p JOIN (VALUES
 ('PRJ-2026-001', 'Children enrolled', 'Direct', 'children', 600, 340),
 ('PRJ-2026-001', 'Villages covered', 'Indirect', 'villages', 12, 8),
 ('PRJ-2026-002', 'Patients screened', 'Direct', 'patients', 5000, 1650),
 ('PRJ-2026-003', 'Households composting', 'Direct', 'households', 250, 0)
) AS i(code, name, category, unit, target, current_value) ON p.project_code = i.code;

INSERT INTO project_department_checklists (project_id, department_id, responsible_name, priority, checklist_data)
SELECT p.id, c.department_id, c.responsible, c.priority,
       jsonb_build_array(jsonb_build_object('title', 'Readiness', 'items', jsonb_build_array(
         jsonb_build_object('label', 'Plan reviewed', 'done', c.done1),
         jsonb_build_object('label', 'Owner assigned', 'done', c.done2))))
FROM projects p JOIN (VALUES
 ('PRJ-2026-001', 'operations', 'Rahul Mehta', 1, true, true),
 ('PRJ-2026-001', 'finance', 'Anita Patel', 2, true, false),
 ('PRJ-2026-002', 'operations', 'Sunita Roy', 1, true, false)
) AS c(code, department_id, responsible, priority, done1, done2) ON p.project_code = c.code;

INSERT INTO project_team_members (project_id, name, role_title, member_group)
SELECT p.id, m.name, m.role_title, m.member_group FROM projects p JOIN (VALUES
 ('PRJ-2026-001', 'Rahul Mehta', 'Project Lead', 'Core'),
 ('PRJ-2026-001', 'Priya Nair', 'Field Coordinator', 'Working'),
 ('PRJ-2026-002', 'Sunita Roy', 'Project Lead', 'Core')
) AS m(code, name, role_title, member_group) ON p.project_code = m.code;

INSERT INTO project_partners (project_id, name, partner_type, contribution)
SELECT p.id, x.name, x.partner_type, x.contribution FROM projects p JOIN (VALUES
 ('PRJ-2026-001', 'Zilla Parishad School Board', 'Government', 'Classroom space'),
 ('PRJ-2026-002', 'City Care Hospital', 'Hospital', 'Doctors and diagnostics')
) AS x(code, name, partner_type, contribution) ON p.project_code = x.code;
