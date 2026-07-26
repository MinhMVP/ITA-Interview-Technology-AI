-- ==============================================================================
-- TÁCH BIỆT PHẦN PHÂN TÍCH CV VÀ NỘP CV ỨNG TUYỂN (VÁ LỖI XÓA CV BỊ RÀNG BUỘC)
-- Copy toàn bộ nội dung file này dán vào SQL Editor của Supabase và Bấm RUN
-- ==============================================================================

-- 1. Thêm 2 cột cv_url và cv_file_name vào bảng job_applications để lưu trực tiếp file CV khi nộp
ALTER TABLE public.job_applications 
  ADD COLUMN IF NOT EXISTS cv_url TEXT,
  ADD COLUMN IF NOT EXISTS cv_file_name TEXT;

-- 2. Sao chép thông tin URL và tên CV từ bảng cvs sang thẳng bảng job_applications cho các hồ sơ cũ (để không mất dữ liệu)
UPDATE public.job_applications
SET 
  cv_url = cvs.file_url,
  cv_file_name = cvs.file_name
FROM public.cvs
WHERE public.job_applications.cv_id = cvs.id 
  AND (public.job_applications.cv_url IS NULL OR public.job_applications.cv_url = '');

-- 3. Tháo gỡ khóa ngoại (Foreign Key constraint) ràng buộc cứng giữa job_applications và cvs
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_cv_id_fkey;

-- 4. Đặt lại khóa ngoại với cơ chế ON DELETE SET NULL (Nếu ứng viên có lỡ xóa CV bên phần Quản lý CV/Phân tích, hồ sơ ứng tuyển vẫn nguyên vẹn không bao giờ bị báo lỗi!)
ALTER TABLE public.job_applications 
  ADD CONSTRAINT job_applications_cv_id_fkey 
  FOREIGN KEY (cv_id) REFERENCES public.cvs(id) ON DELETE SET NULL;
