-- V2__seed_data.sql
-- Bootstraps a demo company, full permission catalog, an ADMIN role granted
-- every permission, and an initial admin user so the API is testable
-- immediately after startup.
--
-- Login with:
--   username: admin
--   password: Admin@123

INSERT INTO companies (id, company_code, company_name, trade_name, email, city, country, currency_code, active)
VALUES ('11111111-1111-1111-1111-111111111111', 'DEMO001', 'Demo Trading Co Pvt Ltd', 'Demo Traders',
        'accounts@demotraders.example', 'Ahmedabad', 'India', 'INR', TRUE);

INSERT INTO permissions (id, code, name, module, description) VALUES
    ('21111111-1111-1111-1111-111111111101', 'USER_CREATE',       'Create User',       'USER',       'Create new users'),
    ('21111111-1111-1111-1111-111111111102', 'USER_UPDATE',       'Update User',       'USER',       'Update existing users'),
    ('21111111-1111-1111-1111-111111111103', 'USER_DELETE',       'Delete User',       'USER',       'Deactivate users'),
    ('21111111-1111-1111-1111-111111111104', 'USER_VIEW',         'View User',         'USER',       'View users'),
    ('21111111-1111-1111-1111-111111111105', 'ROLE_MANAGE',       'Manage Roles',      'ROLE',       'Create/update/delete roles'),
    ('21111111-1111-1111-1111-111111111106', 'PERMISSION_MANAGE', 'Manage Permissions','PERMISSION', 'Create/update/delete permissions'),
    ('21111111-1111-1111-1111-111111111107', 'COMPANY_CREATE',    'Create Company',    'COMPANY',    'Create new companies'),
    ('21111111-1111-1111-1111-111111111108', 'COMPANY_UPDATE',    'Update Company',    'COMPANY',    'Update existing companies'),
    ('21111111-1111-1111-1111-111111111109', 'COMPANY_DELETE',    'Delete Company',    'COMPANY',    'Deactivate companies'),
    ('21111111-1111-1111-1111-111111111110', 'COMPANY_VIEW',      'View Company',      'COMPANY',    'View companies');

INSERT INTO roles (id, code, name, description) VALUES
    ('31111111-1111-1111-1111-111111111101', 'ADMIN', 'Administrator', 'Full system access'),
    ('31111111-1111-1111-1111-111111111102', 'ACCOUNTANT', 'Accountant', 'Day-to-day accounting operations');

-- Grant every permission to ADMIN
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '31111111-1111-1111-1111-111111111101', p.id
FROM permissions p;

-- Grant view-only permissions to ACCOUNTANT
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), '31111111-1111-1111-1111-111111111102', p.id
FROM permissions p
WHERE p.code IN ('USER_VIEW', 'COMPANY_VIEW');

-- Admin user, password: Admin@123  (BCrypt hash below)
INSERT INTO users (id, username, email, password_hash, full_name, active)
VALUES ('41111111-1111-1111-1111-111111111101', 'admin', 'admin@demotraders.example',
        '$2b$10$r5Tib1zGFCz3LIH3eUreB.0c.8dl58VL36mb8IcKBcfGkPj0wZRue',
        'System Administrator', TRUE);

INSERT INTO user_roles (id, user_id, role_id)
VALUES (gen_random_uuid(), '41111111-1111-1111-1111-111111111101', '31111111-1111-1111-1111-111111111101');

INSERT INTO user_companies (id, user_id, company_id, is_default)
VALUES (gen_random_uuid(), '41111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', TRUE);


--{
--  "username": "john",
--  "email": "john.doe@example.com",
--  "password": "John@12345",
--  "fullName": "John Doe",
--  "phone": "+1-202-555-0147",
--  "active": true
--}

