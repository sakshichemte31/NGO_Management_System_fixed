BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS departments (
    id text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL CHECK (role IN ('Admin', 'Project Manager', 'Staff', 'Volunteer', 'Board')),
    department_id text REFERENCES departments(id) ON DELETE SET NULL,
    phone text,
    is_active boolean NOT NULL DEFAULT true,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    jti uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE TABLE IF NOT EXISTS proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_code text NOT NULL UNIQUE,
    title text NOT NULL,
    sector text NOT NULL,
    summary text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Financial Review', 'Approved', 'Rejected', 'Withdrawn')),
    estimated_budget numeric(14, 2) NOT NULL DEFAULT 0 CHECK (estimated_budget >= 0),
    expected_beneficiaries text NOT NULL DEFAULT '',
    priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    start_date date,
    end_date date,
    geography text NOT NULL DEFAULT '',
    review_notes text NOT NULL DEFAULT '',
    planning_status text NOT NULL DEFAULT 'Not Started'
        CHECK (planning_status IN ('Not Started', 'In Progress', 'Complete')),
    planning_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    submitted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code text NOT NULL UNIQUE,
    proposal_id uuid UNIQUE REFERENCES proposals(id) ON DELETE SET NULL,
    name text NOT NULL,
    sector text NOT NULL,
    summary text NOT NULL DEFAULT '',
    why text NOT NULL DEFAULT '',
    problem_statement text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'Upcoming'
        CHECK (status IN ('Active', 'Upcoming', 'Completed', 'On Hold', 'Archived')),
    current_status text NOT NULL DEFAULT 'Ideation'
        CHECK (current_status IN ('Ideation', 'Pilot', 'Seed', 'Scale')),
    current_stage smallint NOT NULL DEFAULT 0 CHECK (current_stage BETWEEN 0 AND 5),
    progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    sdg_goals smallint[] NOT NULL DEFAULT '{}',
    manager_id uuid REFERENCES users(id) ON DELETE SET NULL,
    active_since date,
    start_date date,
    end_date date,
    archived_at timestamptz,
    geography jsonb NOT NULL DEFAULT '{}'::jsonb,
    plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS project_team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    name text NOT NULL,
    role_title text NOT NULL,
    member_group text NOT NULL CHECK (member_group IN ('Core', 'Advisory', 'Working')),
    organization text,
    email text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_partners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    partner_type text NOT NULL,
    contribution text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS project_milestones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    stage smallint NOT NULL CHECK (stage BETWEEN 0 AND 5),
    due_date date,
    status text NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'In Progress', 'Done', 'Delayed')),
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    owner_name text,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
    assignee_name text,
    department_id text REFERENCES departments(id) ON DELETE SET NULL,
    stage smallint NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 5),
    priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status text NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Review', 'Done')),
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_department_checklists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    department_id text NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    responsible_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    responsible_name text,
    priority smallint CHECK (priority BETWEEN 1 AND 7),
    checklist_data jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, department_id),
    UNIQUE (project_id, priority)
);

CREATE TABLE IF NOT EXISTS project_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    file_name text,
    file_url text,
    status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Uploaded', 'Verified')),
    uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
    verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at timestamptz,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (status = 'Pending' OR file_url IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS project_budget_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    section text NOT NULL CHECK (section IN ('Salaries', 'Operations', 'Assets')),
    item_name text NOT NULL,
    item_type text,
    quantity numeric(12, 2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    unit_cost numeric(14, 2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    frequency_per_year smallint CHECK (frequency_per_year IS NULL OR frequency_per_year >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    expense_date date NOT NULL,
    section text NOT NULL CHECK (section IN ('Salaries', 'Operations', 'Assets')),
    head text NOT NULL,
    description text NOT NULL DEFAULT '',
    amount numeric(14, 2) NOT NULL CHECK (amount > 0),
    currency char(3) NOT NULL DEFAULT 'INR',
    paid_to text NOT NULL,
    added_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_funding_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_name text NOT NULL,
    amount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    currency char(3) NOT NULL DEFAULT 'INR',
    status text NOT NULL DEFAULT 'Identified'
        CHECK (status IN ('Identified', 'Applied', 'Committed', 'Received')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS impact_indicators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('Direct', 'Indirect', 'Societal')),
    unit text NOT NULL,
    target numeric(16, 3) NOT NULL DEFAULT 0 CHECK (target >= 0),
    current_value numeric(16, 3) NOT NULL DEFAULT 0 CHECK (current_value >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS impact_measurements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_id uuid NOT NULL REFERENCES impact_indicators(id) ON DELETE CASCADE,
    measured_on date NOT NULL,
    value numeric(16, 3) NOT NULL CHECK (value >= 0),
    source text NOT NULL,
    note text NOT NULL DEFAULT '',
    recorded_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS beneficiaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code text UNIQUE,
    full_name text NOT NULL,
    date_of_birth date,
    gender text,
    phone text,
    email text,
    address text,
    city text,
    district text,
    state text,
    consent_to_data_use boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS beneficiary_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id uuid NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category text NOT NULL,
    enrolled_on date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Exited')),
    notes text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (beneficiary_id, project_id)
);

CREATE TABLE IF NOT EXISTS beneficiary_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL REFERENCES beneficiary_enrollments(id) ON DELETE CASCADE,
    service_name text NOT NULL,
    provided_on date NOT NULL DEFAULT CURRENT_DATE,
    notes text NOT NULL DEFAULT '',
    provided_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_code text UNIQUE,
    display_name text NOT NULL,
    donor_type text NOT NULL CHECK (donor_type IN ('Individual', 'Corporate', 'Foundation', 'Government', 'Other')),
    email text,
    phone text,
    city text,
    state text,
    relationship_status text NOT NULL DEFAULT 'New',
    interests text[] NOT NULL DEFAULT '{}',
    notes text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donor_occasions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id uuid NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    occasion_type text NOT NULL,
    occasion_date date NOT NULL,
    reminder_days smallint NOT NULL DEFAULT 7 CHECK (reminder_days >= 0),
    notes text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (donor_id, occasion_type, occasion_date)
);

CREATE TABLE IF NOT EXISTS campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_code text UNIQUE,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
    goal_amount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (goal_amount >= 0),
    currency char(3) NOT NULL DEFAULT 'INR',
    starts_on date,
    ends_on date,
    status text NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Active', 'Completed', 'Paused')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS contributions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id uuid NOT NULL REFERENCES donors(id) ON DELETE RESTRICT,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
    project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
    amount numeric(14, 2) NOT NULL CHECK (amount > 0),
    currency char(3) NOT NULL DEFAULT 'INR',
    contributed_on date NOT NULL DEFAULT CURRENT_DATE,
    payment_method text,
    transaction_reference text UNIQUE,
    status text NOT NULL DEFAULT 'Received' CHECK (status IN ('Pledged', 'Received', 'Failed', 'Refunded')),
    receipt_number text UNIQUE,
    notes text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donor_interactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id uuid NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    interaction_type text NOT NULL CHECK (interaction_type IN ('Call', 'Email', 'Meeting', 'Visit', 'Gift', 'Other')),
    summary text NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    follow_up_at timestamptz,
    follow_up_status text NOT NULL DEFAULT 'None'
        CHECK (follow_up_status IN ('None', 'Pending', 'Scheduled', 'Completed')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    starts_at timestamptz NOT NULL,
    ends_at timestamptz,
    location text NOT NULL DEFAULT '',
    capacity integer CHECK (capacity IS NULL OR capacity >= 0),
    event_type text NOT NULL DEFAULT 'Community'
        CHECK (event_type IN ('Community', 'Fundraiser', 'Training', 'Outreach', 'Meeting')),
    organizer text NOT NULL DEFAULT '',
    budget numeric(14, 2) NOT NULL DEFAULT 0 CHECK (budget >= 0),
    status text NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    beneficiary_id uuid REFERENCES beneficiaries(id) ON DELETE CASCADE,
    donor_id uuid REFERENCES donors(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    attendance_status text NOT NULL DEFAULT 'Registered'
        CHECK (attendance_status IN ('Registered', 'Attended', 'Absent', 'Cancelled')),
    registered_at timestamptz NOT NULL DEFAULT now(),
    CHECK (num_nonnulls(beneficiary_id, donor_id, user_id) = 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_event_beneficiary_idx
    ON event_registrations(event_id, beneficiary_id) WHERE beneficiary_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_event_donor_idx
    ON event_registrations(event_id, donor_id) WHERE donor_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_event_user_idx
    ON event_registrations(event_id, user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS event_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
    caption text NOT NULL DEFAULT '',
    content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
    size_bytes integer NOT NULL CHECK (size_bytes > 0),
    data bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_photos_event_idx ON event_photos(event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS staff_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_code text NOT NULL UNIQUE,
    job_title text NOT NULL,
    department_id text REFERENCES departments(id) ON DELETE SET NULL,
    employment_type text NOT NULL DEFAULT 'Full-time',
    hired_on date,
    manager_id uuid REFERENCES users(id) ON DELETE SET NULL,
    salary numeric(14, 2) CHECK (salary IS NULL OR salary >= 0),
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    attendance_date date NOT NULL,
    check_in timestamptz,
    check_out timestamptz,
    status text NOT NULL CHECK (status IN ('Present', 'Absent', 'Leave', 'Holiday')),
    notes text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (staff_id, attendance_date),
    CHECK (check_out IS NULL OR check_in IS NULL OR check_out >= check_in)
);

CREATE TABLE IF NOT EXISTS volunteer_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    email text,
    phone text,
    skills text[] NOT NULL DEFAULT '{}',
    availability text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Applicant', 'Active', 'Inactive')),
    joined_on date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS volunteer_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id uuid NOT NULL REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_title text NOT NULL,
    starts_on date,
    ends_on date,
    status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS intern_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    area_of_interest text NOT NULL,
    applied_on date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'Applied'
        CHECK (status IN ('Applied', 'Under Review', 'Accepted', 'Rejected', 'Completed')),
    assigned_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
    notes text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject text NOT NULL,
    channel text NOT NULL CHECK (channel IN ('Email', 'Phone', 'SMS', 'In Person', 'Other')),
    body text NOT NULL DEFAULT '',
    donor_id uuid REFERENCES donors(id) ON DELETE SET NULL,
    beneficiary_id uuid REFERENCES beneficiaries(id) ON DELETE SET NULL,
    project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
    sent_by uuid REFERENCES users(id) ON DELETE SET NULL,
    sent_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'Logged' CHECK (status IN ('Draft', 'Sent', 'Delivered', 'Failed', 'Logged')),
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (num_nonnulls(donor_id, beneficiary_id, project_id) >= 1)
);

CREATE TABLE IF NOT EXISTS project_resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    resource_type text NOT NULL,
    quantity numeric(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit text NOT NULL DEFAULT 'item',
    location text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'In Use', 'Maintenance', 'Retired')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_risks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    issue_type text NOT NULL CHECK (issue_type IN ('Risk', 'Issue')),
    severity text NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Accepted')),
    mitigation text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
    category text NOT NULL,
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    changes jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_manager_id_idx ON projects(manager_id);
CREATE INDEX IF NOT EXISTS projects_sector_idx ON projects(sector);
CREATE INDEX IF NOT EXISTS project_tasks_project_status_idx ON project_tasks(project_id, status);
CREATE INDEX IF NOT EXISTS project_tasks_due_date_idx ON project_tasks(due_date);
CREATE INDEX IF NOT EXISTS project_milestones_project_due_date_idx ON project_milestones(project_id, due_date);
CREATE INDEX IF NOT EXISTS project_expenses_project_date_idx ON project_expenses(project_id, expense_date);
CREATE INDEX IF NOT EXISTS impact_measurements_indicator_date_idx ON impact_measurements(indicator_id, measured_on);
CREATE INDEX IF NOT EXISTS beneficiary_enrollments_project_status_idx ON beneficiary_enrollments(project_id, status);
CREATE INDEX IF NOT EXISTS donors_display_name_idx ON donors(display_name);
CREATE INDEX IF NOT EXISTS contributions_donor_date_idx ON contributions(donor_id, contributed_on DESC);
CREATE INDEX IF NOT EXISTS contributions_campaign_idx ON contributions(campaign_id);
CREATE INDEX IF NOT EXISTS events_starts_at_idx ON events(starts_at);
CREATE INDEX IF NOT EXISTS activity_logs_project_created_idx ON activity_logs(project_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'users', 'proposals', 'projects', 'project_milestones', 'project_tasks',
        'project_department_checklists', 'beneficiaries', 'donors', 'campaigns',
        'events', 'staff_profiles', 'volunteer_profiles', 'intern_applications',
        'project_resources', 'project_risks'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', table_name);
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
            table_name
        );
    END LOOP;
END;
$$;

COMMIT;
