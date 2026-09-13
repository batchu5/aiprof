-- ============================================================================
-- 🎓 AI STUDY COMPANION - COMPLETE SUPABASE POSTGRESQL SCHEMA MIGRATION
-- ============================================================================
-- Description: Single production-grade PostgreSQL migration file for Supabase.
-- Features: pgvector (Gemini 768-dim embeddings), Row Level Security (RLS),
--           mastery aggregation triggers, RAG vector search function, and seed data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- 2. TABLES DEFINITIONS
-- ----------------------------------------------------------------------------

-- TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: spaces
CREATE TABLE IF NOT EXISTS public.spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT '📚',
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    learning_goal TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    overall_mastery DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: materials
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT NOT NULL DEFAULT 'pdf',
    processing_status TEXT NOT NULL DEFAULT 'queued' CHECK (
        processing_status IN ('queued', 'processing', 'reading', 'extracting', 'embedding', 'ready', 'failed')
    ),
    processing_error TEXT,
    page_count INT,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: content_chunks
CREATE TABLE IF NOT EXISTS public.content_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INT NOT NULL,
    page_number INT,
    section_title TEXT,
    embedding vector(768), -- Google Gemini Embedding Dimension
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: concepts
CREATE TABLE IF NOT EXISTS public.concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    source_material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: concept_mastery
CREATE TABLE IF NOT EXISTS public.concept_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mastery_level DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 100),
    previous_level DOUBLE PRECISION NOT NULL DEFAULT 0,
    evidence_count INT NOT NULL DEFAULT 0,
    last_assessed_at TIMESTAMPTZ,
    trend TEXT NOT NULL DEFAULT 'new' CHECK (trend IN ('improving', 'stable', 'needs_attention', 'new')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_concept_user UNIQUE (concept_id, user_id)
);

-- TABLE: conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    summary TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    message_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    total_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    score DOUBLE PRECISION,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: quiz_questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'open_ended')),
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT,
    user_answer TEXT,
    is_correct BOOLEAN,
    ai_feedback TEXT,
    explanation TEXT,
    score DOUBLE PRECISION,
    time_spent_seconds INT,
    question_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('review_material', 'take_quiz', 'tutor_session', 'focus_concept', 'practice')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority INT NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    related_concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: activity_events
CREATE TABLE IF NOT EXISTS public.activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: ai_usage_logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    feature TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    latency_ms INT,
    estimated_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout')),
    error_message TEXT,
    request_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: learning_context
CREATE TABLE IF NOT EXISTS public.learning_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL CHECK (
        context_type IN ('goal', 'preference', 'strength', 'weakness', 'insight', 'important_note')
    ),
    content TEXT NOT NULL,
    source TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_learning_context UNIQUE (project_id, user_id, context_type, content)
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES
-- ----------------------------------------------------------------------------

-- Vector Cosine Similarity Search Index
CREATE INDEX IF NOT EXISTS idx_content_chunks_embedding 
ON public.content_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- B-Tree Performance Indexes
CREATE INDEX IF NOT EXISTS idx_content_chunks_proj_mat ON public.content_chunks (project_id, material_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_type_date ON public.activity_events (user_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_feat_date ON public.ai_usage_logs (user_id, feature, created_at);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_proj_user ON public.concept_mastery (project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_date ON public.messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order ON public.quiz_questions (quiz_id, question_order);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Helper function to verify admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_context ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles Policy
CREATE POLICY "Profiles access policy" ON public.profiles
    FOR ALL USING (auth.uid() = id OR public.is_admin());

-- 4.2 Spaces Policy
CREATE POLICY "Spaces user access" ON public.spaces
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4.3 Projects Policy
CREATE POLICY "Projects user access" ON public.projects
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4.4 Materials Policy
CREATE POLICY "Materials user access" ON public.materials
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4.5 Content Chunks Policy (via material ownership chain)
CREATE POLICY "Content chunks access via material" ON public.content_chunks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.materials 
            WHERE materials.id = content_chunks.material_id 
              AND (materials.user_id = auth.uid() OR public.is_admin())
        )
    );

-- 4.6 Concepts Policy (via project ownership chain)
CREATE POLICY "Concepts access via project" ON public.concepts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = concepts.project_id 
              AND (projects.user_id = auth.uid() OR public.is_admin())
        )
    );

-- 4.7 Concept Mastery Policy
CREATE POLICY "Concept mastery user access" ON public.concept_mastery
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4.8 Conversations Policy
CREATE POLICY "Conversations user access" ON public.conversations
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4.9 Messages Policy (via conversation ownership chain)
CREATE POLICY "Messages access via conversation" ON public.messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
              AND (conversations.user_id = auth.uid() OR public.is_admin())
        )
    );

-- 4.10 Quizzes Policy
CREATE POLICY "Quizzes user access" ON public.quizzes
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4.11 Quiz Questions Policy (via quiz ownership chain)
CREATE POLICY "Quiz questions access via quiz" ON public.quiz_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quizzes 
            WHERE quizzes.id = quiz_questions.quiz_id 
              AND (quizzes.user_id = auth.uid() OR public.is_admin())
        )
    );

-- 4.12 Recommendations Policy
CREATE POLICY "Recommendations user access" ON public.recommendations
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4.13 Activity Events Policy
CREATE POLICY "Activity events user access" ON public.activity_events
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4.14 AI Usage Logs Policy
CREATE POLICY "AI usage logs user access" ON public.ai_usage_logs
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 4.15 Learning Context Policy
CREATE POLICY "Learning context user access" ON public.learning_context
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function 5.1: Vector Similarity Search for RAG (Cosine Distance)
CREATE OR REPLACE FUNCTION public.match_chunks(
    query_embedding vector(768),
    match_project_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    material_id UUID,
    project_id UUID,
    content TEXT,
    chunk_index INT,
    page_number INT,
    section_title TEXT,
    similarity DOUBLE PRECISION,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.material_id,
        cc.project_id,
        cc.content,
        cc.chunk_index,
        cc.page_number,
        cc.section_title,
        (1 - (cc.embedding <=> query_embedding))::DOUBLE PRECISION AS similarity,
        cc.metadata
    FROM public.content_chunks cc
    WHERE cc.project_id = match_project_id
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function 5.2: Recalculate Project Overall Mastery
CREATE OR REPLACE FUNCTION public.update_project_mastery()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    avg_mastery DOUBLE PRECISION;
BEGIN
    SELECT COALESCE(AVG(mastery_level), 0)
    INTO avg_mastery
    FROM public.concept_mastery
    WHERE project_id = NEW.project_id AND user_id = NEW.user_id;

    UPDATE public.projects
    SET overall_mastery = avg_mastery,
        updated_at = now()
    WHERE id = NEW.project_id;

    RETURN NEW;
END;
$$;

-- Function 5.3: Handle New User Signup from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = now();

    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger on concept_mastery update
DROP TRIGGER IF EXISTS on_concept_mastery_updated ON public.concept_mastery;
CREATE TRIGGER on_concept_mastery_updated
    AFTER INSERT OR UPDATE ON public.concept_mastery
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_mastery();

-- ----------------------------------------------------------------------------
-- 7. SEED DATA
-- ----------------------------------------------------------------------------

-- Seed Admin User safely in auth.users and public.profiles
DO $$
DECLARE
    admin_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. Insert into auth.users first if not exists (satisfies foreign key constraint)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_id) THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            admin_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@studycompanion.ai',
            '$2a$10$wN9P34jD2yJt7l0K/tX2e.p7O9aV3Qk2Y9m5a2q.z4e1r6s8t0u',
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"System Administrator","role":"admin"}'::jsonb,
            now(),
            now()
        );
    END IF;

    -- 2. Insert or update public.profiles
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (admin_id, 'admin@studycompanion.ai', 'System Administrator', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
END $$;

