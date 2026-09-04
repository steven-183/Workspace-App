-- ==========================================
-- SCRIPT ĐỒNG BỘ 100% CƠ SỞ DỮ LIỆU SUPABASE
-- (Chạy an toàn trong Supabase SQL Editor)
-- ==========================================

-- 1. BẢNG PROFILES (Lưu hồ sơ thành viên)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG PROJECTS (Lưu các bảng dự án)
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Dự án',
  team_id TEXT DEFAULT 'product',
  is_favorite BOOLEAN DEFAULT false,
  views JSONB DEFAULT '["kanban", "timeline", "table", "calendar", "list"]'::jsonb,
  active_view TEXT DEFAULT 'kanban',
  columns JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. BẢNG TASKS (Lưu công việc và phân công)
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'backlog',
  priority TEXT DEFAULT 'none',
  start_date TEXT,
  due_date TEXT,
  start_time TEXT,
  due_time TEXT,
  progress INTEGER DEFAULT 0,
  "order" NUMERIC DEFAULT 1,
  assignees JSONB DEFAULT '[]'::jsonb,
  creator JSONB,
  followers JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  subtasks JSONB DEFAULT '[]'::jsonb,
  blocks JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  activity_logs JSONB DEFAULT '[]'::jsonb,
  is_archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  cover_image TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. BỔ SUNG CỘT NẾU BẢNG ĐÃ ĐƯỢC TẠO TỪ TRƯỚC
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_time TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS activity_logs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'product';

-- 5. MỞ QUYỀN TRUY CẬP ĐỂ CẢ TEAM ĐỀU THẤY TASK CỦA NHAU (Team workspace)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- 6. BẬT BẢNG REALTIME TRONG SUPABASE
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
