CREATE TABLE invites (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  label VARCHAR(255) NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE external_contacts (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  display_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(255) NULL,
  position VARCHAR(100) NULL,
  department VARCHAR(100) NULL,
  avatar_initials VARCHAR(5) NULL,
  notes TEXT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'manual',
  linked_user_id INTEGER NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_created_by ON invites(created_by);
CREATE INDEX idx_external_contacts_owner ON external_contacts(owner_id);
