-- ==============================================================================
-- DATABASE SCHEMA CHO DỰ ÁN AI MOCK INTERVIEW (SUPABASE / POSTGRESQL)
-- Copy toàn bộ nội dung file này dán vào SQL Editor của Supabase và chạy (Run)
-- ==============================================================================

-- --------------------------------------------------------
-- 1. EXTENSIONS
-- --------------------------------------------------------
-- Cài đặt extension để tạo UUID tự động
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 2. BẢNG NGƯỜI DÙNG (PROFILES)
-- Bảng này mở rộng từ bảng auth.users mặc định của Supabase
-- --------------------------------------------------------
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    dob DATE,
    role TEXT CHECK (role IN ('candidate', 'recruiter', 'admin')) DEFAULT 'candidate',
    plan TEXT DEFAULT 'Free', -- Cột lưu gói dịch vụ hiện tại (Free, Pro, Premium)
    status TEXT CHECK (status IN ('active', 'pending', 'banned')) DEFAULT 'active', -- Recruiter mới đăng ký sẽ là 'pending'
    points INTEGER DEFAULT 0, -- Điểm thưởng từ Daily Challenges
    streak_days INTEGER DEFAULT 0, -- Số ngày đăng nhập liên tiếp
    question_bank_usage_count INTEGER DEFAULT 0, -- Số lượt đã sử dụng ngân hàng câu hỏi
    last_login_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------
-- 3. BẢNG GÓI DỊCH VỤ & THANH TOÁN (SUBSCRIPTIONS)
-- --------------------------------------------------------
CREATE TABLE subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- Ví dụ: Basic, Pro, Premium
    price DECIMAL(10, 2) NOT NULL,
    features JSONB, -- Danh sách các tính năng được hưởng
    duration_days INTEGER NOT NULL DEFAULT 30
);

CREATE TABLE user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active'
);

-- --------------------------------------------------------
-- 4. BẢNG QUẢN LÝ CV
-- --------------------------------------------------------
CREATE TABLE cvs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- Link file lưu trên Supabase Storage
    is_default BOOLEAN DEFAULT false,
    ai_analysis_result JSONB, -- Điểm mạnh, điểm yếu, lời khuyên (Lưu dưới dạng JSON)
    ai_score INTEGER, -- Điểm đánh giá tổng quan (0-100)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- --------------------------------------------------------
-- 5. BẢNG NGÀNH NGHỀ & CÂU HỎI (QUESTION BANK)
-- --------------------------------------------------------
CREATE TABLE industries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- IT, Marketing, HR, Finance...
    description TEXT
);

CREATE TABLE questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    question_type TEXT CHECK (question_type IN ('behavioral', 'technical')) DEFAULT 'technical',
    options TEXT, -- Dùng cho trắc nghiệm (VD: A. ... B. ...)
    correct_answer TEXT -- Đáp án đúng
);

-- --------------------------------------------------------
-- 6. BẢNG PHỎNG VẤN GIẢ LẬP (MOCK INTERVIEWS)
-- --------------------------------------------------------
CREATE TABLE interviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    industry_id UUID REFERENCES industries(id),
    status TEXT CHECK (status IN ('in_progress', 'completed', 'cancelled')) DEFAULT 'in_progress',
    overall_score INTEGER,
    overall_feedback TEXT, -- Lời khuyên chung từ AI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE interview_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    user_answer_text TEXT, -- Text từ Speech-to-Text
    user_answer_audio_url TEXT, -- Link file ghi âm (nếu có)
    ai_evaluation JSONB, -- Phân tích của AI cho từng câu hỏi (ngữ điệu, từ vựng, độ chính xác)
    score INTEGER -- Điểm cho câu hỏi này
);

-- --------------------------------------------------------
-- 7. BẢNG TUYỂN DỤNG & DOANH NGHIỆP (RECRUITER & COMPANIES)
-- --------------------------------------------------------
CREATE TABLE companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    tax_id TEXT,
    website TEXT,
    address TEXT,
    description TEXT,
    logo_url TEXT,
    document_url TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    industry_id UUID REFERENCES industries(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    salary_range TEXT,
    status TEXT CHECK (status IN ('draft', 'open', 'closed')) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE job_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    cv_id UUID REFERENCES cvs(id),
    status TEXT CHECK (status IN ('applied', 'reviewing', 'interviewing', 'accepted', 'rejected')) DEFAULT 'applied',
    recruiter_notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- --------------------------------------------------------
-- 8. BẢNG BÀI VIẾT (BLOG / TIPS)
-- --------------------------------------------------------
CREATE TABLE blogs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES profiles(id), -- Admin hoặc Mentor
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Lưu dưới dạng Markdown hoặc HTML
    cover_image_url TEXT,
    tags TEXT[], -- Mảng các tag (VD: ['interview', 'tips', 'it'])
    status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'published',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- --------------------------------------------------------
-- 9. BẢNG THỬ THÁCH HÀNG NGÀY (DAILY CHALLENGES)
-- --------------------------------------------------------
CREATE TABLE challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points_reward INTEGER NOT NULL DEFAULT 10,
    active_date DATE UNIQUE NOT NULL -- Mỗi ngày có 1 thử thách
);

CREATE TABLE user_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, challenge_id) -- Một user chỉ hoàn thành 1 thử thách 1 lần
);

-- ==============================================================================
-- CÀI ĐẶT ROW LEVEL SECURITY (RLS) BẢO MẬT DỮ LIỆU
-- Lưu ý: Đây là cấu hình cơ bản, có thể chỉnh sửa tùy nhu cầu
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Cấu hình RLS cho bảng companies
CREATE POLICY "Anyone can view approved companies" ON companies FOR SELECT USING (status = 'approved');
CREATE POLICY "Recruiters can view own company" ON companies FOR SELECT USING (auth.uid() = recruiter_id);
CREATE POLICY "Users can insert company" ON companies FOR INSERT WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can update own company" ON companies FOR UPDATE USING (auth.uid() = recruiter_id);

-- User chỉ có thể xem và sửa Profile của chính mình
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User chỉ có thể xem và sửa CV của chính mình
CREATE POLICY "Users can view own CVs" ON cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own CVs" ON cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CVs" ON cvs FOR UPDATE USING (auth.uid() = user_id);

-- User chỉ xem được bài phỏng vấn của mình
CREATE POLICY "Users can view own interviews" ON interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interviews" ON interviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger tự động tạo Profile khi user mới đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'candidate'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- QUYỀN TRUY CẬP CHO ADMIN (RLS POLICIES FOR ADMIN)
-- Bổ sung quyền cho phép Admin quản lý dữ liệu trên Admin Panel
-- ==============================================================================

-- 1. Hàm kiểm tra quyền Admin (an toàn, tránh lỗi vòng lặp đệ quy của RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Admin có toàn quyền trên bảng Profiles (User Management)
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert all profiles" ON profiles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete all profiles" ON profiles FOR DELETE USING (public.is_admin());

-- 3. Bật RLS và cấp quyền cho Admin trên các bảng Quản trị (Question, Industry, Challenge, Blog...)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (public.is_admin());

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view industries" ON industries FOR SELECT USING (true);
CREATE POLICY "Admins can manage industries" ON industries FOR ALL USING (public.is_admin());

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published blogs" ON blogs FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "Admins can manage blogs" ON blogs FOR ALL USING (public.is_admin());

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Admins can manage challenges" ON challenges FOR ALL USING (public.is_admin());

 A S   \ $ \ $ 
 B E G I N 
     D E L E T E   F R O M   c v s   W H E R E   i d   =   c v _ i d ; 
 E N D ; 
 \ $ \ $ ; 
  
 
 - -   B y p a s s e s   A d B l o c k e r   U R L   m a t c h i n g   b y   a v o i d i n g   t h e   w o r d   ' d e l e t e ' 
 C R E A T E   O R   R E P L A C E   F U N C T I O N   d r o p _ c v _ r e c o r d ( c v _ i d   U U I D ) 
 R E T U R N S   v o i d 
 L A N G U A G E   p l p g s q l 
 S E C U R I T Y   D E F I N E R 
 A S   \ $ \ $ 
 B E G I N 
     D E L E T E   F R O M   c v s   W H E R E   i d   =   c v _ i d   A N D   u s e r _ i d   =   a u t h . u i d ( ) ; 
 E N D ; 
 \ $ \ $ ; 
  
 