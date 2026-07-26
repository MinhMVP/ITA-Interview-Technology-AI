-- ==============================================================================
-- SẮP HẾT LỖI RỒI! BẢN VÁ QUYỀN TRUY CẬP RLS (ROW-LEVEL SECURITY)
-- Copy toàn bộ nội dung file này dán vào SQL Editor của Supabase và Bấm RUN
-- ==============================================================================

-- 1. BẬT RLS CHO BẢNG JOB_APPLICATIONS (NẾU CHƯA BẬT)
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- 2. XÓA CÁC POLICY CỦA BẢNG JOB_APPLICATIONS (NẾU CÓ, ĐỂ KHÔNG BỊ TRÙNG LẶP/XUNG ĐỘT)
DROP POLICY IF EXISTS "Allow candidate to insert application" ON public.job_applications;
DROP POLICY IF EXISTS "Allow candidate to view own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow recruiter to view job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow recruiter to update job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow admin full access to job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Users can apply for jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Users can view own job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Recruiters can view applications for their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Recruiters can update applications for their jobs" ON public.job_applications;

-- 3. CHÍNH SÁCH RLS CHO JOB_APPLICATIONS:
-- 3a. Cho phép ứng viên nộp CV ứng tuyển (INSERT)
CREATE POLICY "Allow candidate to insert application" 
ON public.job_applications 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 3b. Cho phép ứng viên xem các công việc mình đã ứng tuyển (SELECT)
CREATE POLICY "Allow candidate to view own applications" 
ON public.job_applications 
FOR SELECT 
TO authenticated
USING (auth.uid() = candidate_id);

-- 3c. Cho phép Nhà tuyển dụng (Recruiter) xem danh sách hồ sơ ứng tuyển vào công việc của công ty mình (SELECT)
CREATE POLICY "Allow recruiter to view job applications" 
ON public.job_applications 
FOR SELECT 
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
);

-- 3d. Cho phép Nhà tuyển dụng cập nhật trạng thái (Trúng tuyển / Từ chối...) và ghi chú cho hồ sơ ứng tuyển (UPDATE)
CREATE POLICY "Allow recruiter to update job applications" 
ON public.job_applications 
FOR UPDATE 
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
);

-- 3e. Cho phép Admin toàn quyền xử lý hồ sơ (ALL)
CREATE POLICY "Allow admin full access to job applications" 
ON public.job_applications 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==============================================================================
-- BỔ SUNG QUYỀN XEM PROFILES & CVS CHO NHÀ TUYỂN DỤNG (ĐỂ XEM TÊN HẢI VÀ TẢI CV PDF)
-- ==============================================================================

-- 4. Cho phép mọi người dùng đã đăng nhập đọc thông tin cơ bản của profiles (để hiển thị Tên, Email ứng viên)
DROP POLICY IF EXISTS "Allow authenticated view profiles" ON public.profiles;
CREATE POLICY "Allow authenticated view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 5. Cho phép Nhà tuyển dụng xem được bản ghi CV của ứng viên nộp vào việc làm của mình
DROP POLICY IF EXISTS "Allow recruiters to read candidate CVs" ON public.cvs;
CREATE POLICY "Allow recruiters to read candidate CVs"
ON public.cvs
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  id IN (
    SELECT cv_id FROM public.job_applications WHERE job_id IN (
      SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
    )
  )
);
