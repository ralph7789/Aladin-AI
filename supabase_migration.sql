-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Roles Table
CREATE TABLE Roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON Roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 2. Users Table
CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role_id UUID REFERENCES Roles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON Users(email);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON Users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. Licenses Table
CREATE TABLE Licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_licenses_active_user_id ON Licenses(user_id) WHERE status = 'active';

CREATE TRIGGER update_licenses_updated_at
BEFORE UPDATE ON Licenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Transactions Table
CREATE TABLE Transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON Transactions(user_id);
CREATE INDEX idx_transactions_completed ON Transactions(user_id) WHERE status = 'completed';

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON Transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. Admin_API_Keys Table
CREATE TABLE Admin_API_Keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    provider VARCHAR(50),
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_api_keys_active ON Admin_API_Keys(user_id) WHERE is_active = true;

CREATE TRIGGER update_admin_api_keys_updated_at
BEFORE UPDATE ON Admin_API_Keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE Licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE Transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE Admin_API_Keys ENABLE ROW LEVEL SECURITY;
