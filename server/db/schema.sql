CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text NOT NULL UNIQUE,
  program text NOT NULL,
  full_name text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL UNIQUE,
  alumnus_up text NOT NULL,
  connected_pgh text NOT NULL,
  occupation text NOT NULL,
  year_joined integer NOT NULL,
  prc_license text,
  department_office text,
  college text,
  course text,
  year_level text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_volunteers_email_lower ON volunteers (lower(email));
CREATE INDEX IF NOT EXISTS idx_volunteers_uid ON volunteers (uid);
CREATE INDEX IF NOT EXISTS idx_volunteers_program ON volunteers (program);
CREATE INDEX IF NOT EXISTS idx_volunteers_year_joined ON volunteers (year_joined);

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admins_name ON admins (name);
