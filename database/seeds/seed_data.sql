INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES ('Demo Company', 'demo', 'active', 'pro', 25, 15);

INSERT INTO users (tenant_id, email, password_hash, full_name, role)
VALUES 
  (NULL, 'superadmin@system.com', crypt('Admin@123', gen_salt('bf')), 'Super Admin', 'super_admin'),
  ((SELECT id FROM tenants WHERE subdomain='demo'), 'admin@demo.com', crypt('Demo@123', gen_salt('bf')), 'Demo Admin', 'tenant_admin'),
  ((SELECT id FROM tenants WHERE subdomain='demo'), 'user1@demo.com', crypt('User@123', gen_salt('bf')), 'Demo User1', 'user'),
  ((SELECT id FROM tenants WHERE subdomain='demo'), 'user2@demo.com', crypt('User@123', gen_salt('bf')), 'Demo User2', 'user');

INSERT INTO projects (tenant_id, name, description, status, created_by)
VALUES
  ((SELECT id FROM tenants WHERE subdomain='demo'), 'Project Alpha', 'First demo project', 'active', (SELECT id FROM users WHERE email='admin@demo.com')),
  ((SELECT id FROM tenants WHERE subdomain='demo'), 'Project Beta', 'Second demo project', 'active', (SELECT id FROM users WHERE email='admin@demo.com'));

INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES
  ((SELECT id FROM projects WHERE name='Project Alpha'), (SELECT id FROM tenants WHERE subdomain='demo'), 'Setup DB', 'Initialize', 'completed', 'high', (SELECT id FROM users WHERE email='user1@demo.com'), '2025-01-10'),
  ((SELECT id FROM projects WHERE name='Project Beta'), (SELECT id FROM tenants WHERE subdomain='demo'), 'Build API', 'Auth module', 'in_progress', 'medium', (SELECT id FROM users WHERE email='user2@demo.com'), '2025-01-20');
