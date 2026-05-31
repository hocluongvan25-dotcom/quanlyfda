-- ============================================================================
-- FDA REGISTRATION WEBSITE - DATABASE SCHEMA
-- ============================================================================
-- This SQL file contains the complete database schema for the FDA Registration 
-- management system. It includes tables, enums, functions, policies, and indexes.
-- Generated: 2026-05-28
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUM TYPES
-- ============================================================================

-- User roles: admin (full access), staff (can manage services), client (customer)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'staff', 'client');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Service types: food, cosmetics, medical devices
DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('food', 'cosmetics', 'medical_device');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Pipeline stages for FDA registration process
DO $$ BEGIN
  CREATE TYPE pipeline_stage AS ENUM (
    'reception_consultation',      -- Stage 1: Initial consultation
    'document_collection',          -- Stage 2: Collect required documents
    'us_agent_assignment',          -- Stage 3: Assign US agent
    'fda_registration',             -- Stage 4: FDA registration submission
    'tracking_update',              -- Stage 5: Track application status
    'completion_handover',          -- Stage 6: Certificate handover
    'renewal_support'               -- Stage 7: Support for renewal
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Document types: required documents or registration results
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('required', 'result');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Notification types: info, warning, success, error
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- Profiles: User information linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services: FDA registration requests from clients
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_type service_type NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  current_stage pipeline_stage DEFAULT 'reception_consultation',
  fda_code TEXT,
  fda_duns_code TEXT,
  fda_fei_code TEXT,
  fda_issue_date DATE,
  fda_expiry_date DATE,
  us_agent_name TEXT,
  us_agent_expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline tasks: Steps within each stage
CREATE TABLE IF NOT EXISTS pipeline_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  stage pipeline_stage NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents: Uploaded files for services
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  category TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  stage pipeline_stage,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications: System notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type notification_type DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification settings: User preferences for notifications
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_service_updates BOOLEAN DEFAULT TRUE,
  email_document_requests BOOLEAN DEFAULT TRUE,
  email_renewal_reminders BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs: Track all actions in the system
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES (for performance optimization)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_services_client_id ON services(client_id);
CREATE INDEX IF NOT EXISTS idx_services_assigned_staff_id ON services(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_services_current_stage ON services(current_stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_tasks_service_id ON pipeline_tasks(service_id);
CREATE INDEX IF NOT EXISTS idx_documents_service_id ON documents(service_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_service_id ON activity_logs(service_id);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Get user role (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- Handle new user signup - automatically create profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'client'
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin/Staff can view all profiles
CREATE POLICY "profiles_select_admin_staff" ON profiles
  FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

-- Users can insert their own profile (for new registrations)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- SERVICES POLICIES
-- ============================================================================

-- Clients can view their own services
CREATE POLICY "services_select_client" ON services
  FOR SELECT USING (auth.uid() = client_id);

-- Staff can view services assigned to them
CREATE POLICY "services_select_staff_assigned" ON services
  FOR SELECT USING (auth.uid() = assigned_staff_id);

-- Admin/Staff can view all services
CREATE POLICY "services_select_admin_staff" ON services
  FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Admin/Staff can insert services
CREATE POLICY "services_insert_admin_staff" ON services
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Admin/Staff can update services
CREATE POLICY "services_update_admin_staff" ON services
  FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Admin can delete services
CREATE POLICY "services_delete_admin" ON services
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- PIPELINE_TASKS POLICIES
-- ============================================================================

-- Clients can view tasks for their services
CREATE POLICY "pipeline_tasks_select_client" ON pipeline_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services s 
      WHERE s.id = pipeline_tasks.service_id 
      AND s.client_id = auth.uid()
    )
  );

-- Admin/Staff can view all tasks
CREATE POLICY "pipeline_tasks_select_admin_staff" ON pipeline_tasks
  FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Admin/Staff can insert tasks
CREATE POLICY "pipeline_tasks_insert_admin_staff" ON pipeline_tasks
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Admin/Staff can update tasks
CREATE POLICY "pipeline_tasks_update_admin_staff" ON pipeline_tasks
  FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Admin can delete tasks
CREATE POLICY "pipeline_tasks_delete_admin" ON pipeline_tasks
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- DOCUMENTS POLICIES
-- ============================================================================

-- Clients can view documents for their services
CREATE POLICY "documents_select_client" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services s 
      WHERE s.id = documents.service_id 
      AND s.client_id = auth.uid()
    )
  );

-- Admin/Staff can view all documents
CREATE POLICY "documents_select_admin_staff" ON documents
  FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Clients can upload documents to their services
CREATE POLICY "documents_insert_client" ON documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM services s 
      WHERE s.id = documents.service_id 
      AND s.client_id = auth.uid()
    )
  );

-- Admin/Staff can upload documents
CREATE POLICY "documents_insert_admin_staff" ON documents
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Admin/Staff can delete documents
CREATE POLICY "documents_delete_admin_staff" ON documents
  FOR DELETE USING (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Admin/Staff can create notifications for anyone
CREATE POLICY "notifications_insert_admin_staff" ON notifications
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATION_SETTINGS POLICIES
-- ============================================================================

-- Users can only see/modify their own settings
CREATE POLICY "notification_settings_select_own" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_settings_insert_own" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_settings_update_own" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- ACTIVITY_LOGS POLICIES
-- ============================================================================

-- Clients can view logs for their services
CREATE POLICY "activity_logs_select_client" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services s 
      WHERE s.id = activity_logs.service_id 
      AND s.client_id = auth.uid()
    )
  );

-- Admin/Staff can view all logs
CREATE POLICY "activity_logs_select_admin_staff" ON activity_logs
  FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- Admin/Staff can insert logs
CREATE POLICY "activity_logs_insert_admin_staff" ON activity_logs
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'staff'));

-- ============================================================================
-- GRANTS (Database Access Control)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- INITIALIZATION DATA (Optional - Comment out if not needed)
-- ============================================================================

-- You can add initial data here as needed
-- INSERT INTO profiles VALUES (...)
