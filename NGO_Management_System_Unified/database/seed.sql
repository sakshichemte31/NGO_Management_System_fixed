BEGIN;

INSERT INTO departments (id, name) VALUES
    ('admin_legal', 'Administration & Legal'),
    ('hr', 'Human Resources'),
    ('marketing', 'Marketing'),
    ('finance', 'Finance'),
    ('fundraising', 'Fundraising'),
    ('operations', 'Operations'),
    ('mel', 'Monitoring, Evaluation & Learning'),
    ('innovation', 'Research & Innovation'),
    ('data_tech', 'Data & Technology')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

COMMIT;
