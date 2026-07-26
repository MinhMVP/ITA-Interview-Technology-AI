-- ==============================================================================
-- BẢN VÁ: CHO PHÉP ỨNG VIÊN XÓA/HỦY HỒ SƠ ỨNG TUYỂN CỦA CHÍNH MÌNH TẠI SUPABASE
-- Hãy copy toàn bộ nội dung dưới đây dán vào SQL Editor của Supabase và bấm RUN nhen!
-- ==============================================================================

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow candidate to delete own applications" ON public.job_applications;
CREATE POLICY "Allow candidate to delete own applications" 
ON public.job_applications 
FOR DELETE 
TO authenticated
USING (auth.uid() = candidate_id);

-- Giải thích nguyên nhân: Mặc định bảng job_applications của Supabase đang bật bảo mật RLS
-- Trước đây chưa có chính sách cho phép ứng viên thực hiện lệnh DELETE, nên khi bấm nút Xóa 
-- giao diện báo thành công nhưng trong cơ sở dữ liệu bị chặn xóa (dẫn đến F5 tải lại vẫn nguyên!).
-- Sau khi RUN xong lệnh này, bạn bấm Thùng Rác là bay hẳn và có thể nộp lại CV thoải mái 100%!
