import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { X, Upload, FileText, CheckSquare, Square, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';

const BUCKET_NAME = 'cv-bucket';

const JobApplyModal = ({ isOpen, onClose, job, onSuccess }) => {
  const [cvFile, setCvFile] = useState(null);
  const [agreeShare, setAgreeShare] = useState(false);
  const [agreeCommit, setAgreeCommit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isOpen && job) {
      checkExistingApplication();
    }
    return () => {
      setCvFile(null);
      setAgreeShare(false);
      setAgreeCommit(false);
      setSubmitting(false);
    };
  }, [isOpen, job]);

  const checkExistingApplication = async () => {
    try {
      setChecking(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('candidate_id', session.user.id)
        .maybeSingle();

      setAlreadyApplied(!!data);
    } catch (err) {
      console.error('Error checking application:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Chỉ chấp nhận file PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File vượt quá 10MB');
      return;
    }
    setCvFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleSubmit = async () => {
    if (!cvFile) {
      toast.error('Vui lòng chọn file CV');
      return;
    }
    if (!agreeShare || !agreeCommit) {
      toast.error('Vui lòng đồng ý với các điều khoản');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Vui lòng đăng nhập để ứng tuyển');
        return;
      }

      // 1. Upload CV to storage using the correct bucket
      const timestamp = Date.now();
      const sanitizedName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${session.user.id}/${timestamp}_${sanitizedName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, cvFile, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      // 3. Create job application (Tách riêng lưu trữ hồ sơ nộp việc làm với bảng cvs dành cho Phân tích CV)
      const { error: appError } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          candidate_id: session.user.id,
          cv_url: urlData.publicUrl,
          cv_file_name: cvFile.name,
          status: 'applied'
        });

      if (appError) throw appError;

      // 5. Lấy thông tin ứng viên từ profile để gửi email & thông báo
      const { data: candidateProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', session.user.id)
        .maybeSingle();

      const candidateName = candidateProfile?.full_name || session.user.email;
      const candidateEmail = candidateProfile?.email || session.user.email;
      const recruiterEmail = job.contactEmail;

      // 6. Gửi email thông báo cho nhà tuyển dụng qua EmailJS
      // LƯU Ý CHO BẠN: Vì ID 'template_5pfbfv9' trên EmailJS của bạn đang là nội dung Đặt lịch Mentor,
      // bạn hãy tạo 1 Template chuyên cho Tuyển Dụng trong trang EmailJS rồi dán mã ID mới vào biến bên dưới nhen:
      const RECRUITMENT_TEMPLATE_ID = 'template_hgte6bg'; // <<< THAY MÃ TEMPLATE TUYỂN DỤNG MỚI TẠI ĐÂY

      if (recruiterEmail) {
        try {
          await emailjs.send(
            'service_gez0q8c',   // Service ID
            RECRUITMENT_TEMPLATE_ID, // Template ID cho Tuyển Dụng
            {
              to_email: recruiterEmail,
              to_name: job.company || 'Nhà tuyển dụng',
              from_name: candidateName,
              name: candidateName,          // Tự động khớp với ô {{name}} trong phần From Name của EmailJS
              email: candidateEmail,        // Tự động khớp với ô {{email}} trong phần Reply To của EmailJS
              candidate_email: candidateEmail,
              candidate_phone: 'Trực tiếp trên file CV',
              candidate_cv: urlData.publicUrl,
              job_title: job.title,
              company_name: job.company || 'Doanh nghiệp',
              apply_date: new Date().toLocaleDateString('vi-VN'),
              apply_time: new Date().toLocaleTimeString('vi-VN'),
              // Giữ cả trường cũ phòng khi bạn sửa trực tiếp trên template cũ:
              booking_date: new Date().toLocaleDateString('vi-VN'),
              booking_time: new Date().toLocaleTimeString('vi-VN'),
              topic: `[HỒ SƠ ỨNG TUYỂN MỚI] Vị trí: ${job.title}`,
              message: `Ứng viên ${candidateName} (${candidateEmail}) vừa nộp CV ứng tuyển vị trí "${job.title}". Bạn có thể nhấn vào link bên dưới để tải/xem CV hoặc truy cập Cổng Nhà tuyển dụng trên hệ thống ITA để duyệt.`,
            },
            're2APjqzHgowc4gPV'    // Public Key
          );
          console.log("Đã gửi email thông báo tới nhà tuyển dụng:", recruiterEmail);
        } catch (emailError) {
          console.error("Lỗi khi gửi email thông báo cho nhà tuyển dụng:", emailError);
          const errorDetail = emailError?.text || emailError?.message || JSON.stringify(emailError);
          console.warn(`Đã nộp CV thành công nhưng có lỗi gửi email tự động (EmailJS): ${errorDetail}`);
        }
      } else {
        console.warn("Không có email nhà tuyển dụng để gửi mail thông báo tự động.");
      }

      // 7. Gửi thông báo trực tiếp trên chuông thông báo (notifications table) cho nhà tuyển dụng
      if (job.recruiterId) {
        try {
          await supabase.from('notifications').insert([{
            user_id: job.recruiterId,
            title: 'Hồ sơ ứng tuyển mới! 📋',
            content: `Ứng viên ${candidateName} vừa nộp CV cho vị trí "${job.title}".`,
            type: 'job',
            action_link: '/recruiter/applications'
          }]);
        } catch (notifErr) {
          console.error("Lỗi khi tạo notification:", notifErr);
        }
      }

      toast.success('Nộp CV thành công! Doanh nghiệp đã được thông báo và sẽ xem xét hồ sơ của bạn.');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error submitting application:', err);
      if (err.message?.includes('duplicate') || err.code === '23505') {
        toast.error('Bạn đã ứng tuyển vị trí này rồi');
      } else {
        toast.error('Lỗi khi nộp CV: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        borderRadius: '20px',
        width: '95%',
        maxWidth: '520px',
        zIndex: 9999,
        boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.3s ease',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FileText size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
              Nộp CV ứng tuyển
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '8px',
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#1f2937'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          {checking ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>Đang kiểm tra...</p>
            </div>
          ) : alreadyApplied ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h4 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>Bạn đã ứng tuyển vị trí này</h4>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                CV của bạn đã được gửi. Vui lòng theo dõi trạng thái tại mục "CV của tôi".
              </p>
              <button
                onClick={onClose}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 2rem',
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Đã hiểu
              </button>
            </div>
          ) : (
            <>
              {/* Job Info */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>Vị Trí Ứng Tuyển:</span>
                  <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: '#1f2937', fontSize: '1rem' }}>{job?.title}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>Doanh Nghiệp:</span>
                  <p style={{ margin: '0.2rem 0 0', fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>{job?.company}</p>
                </div>
              </div>

              {/* File Upload */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
                  File CV <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('cv-file-input').click()}
                  style={{
                    border: `2px dashed ${dragOver ? '#16a34a' : cvFile ? '#16a34a' : '#d1d5db'}`,
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: dragOver ? '#f0fdf4' : cvFile ? '#f0fdf4' : '#fafafa'
                  }}
                >
                  <input
                    id="cv-file-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {cvFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                      <FileText size={20} color="#16a34a" />
                      <span style={{ fontWeight: 600, color: '#16a34a' }}>{cvFile.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCvFile(null); }}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.2rem 0.4rem',
                          cursor: 'pointer',
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} color="#9ca3af" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                        Chọn tệp hoặc kéo thả vào đây
                      </p>
                      <p style={{ margin: '0.3rem 0 0', color: '#9ca3af', fontSize: '0.8rem' }}>
                        Chỉ chấp nhận file PDF, tối đa 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Checkboxes */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label
                  onClick={() => setAgreeShare(!agreeShare)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                    background: agreeShare ? '#f0fdf4' : 'transparent'
                  }}
                >
                  {agreeShare ? (
                    <CheckSquare size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '1px' }} />
                  ) : (
                    <Square size={20} color="#9ca3af" style={{ flexShrink: 0, marginTop: '1px' }} />
                  )}
                  <span style={{ fontSize: '0.88rem', color: '#374151', lineHeight: '1.4' }}>
                    Tôi đồng ý cung cấp thông tin CV cho doanh nghiệp
                  </span>
                </label>

                <label
                  onClick={() => setAgreeCommit(!agreeCommit)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                    background: agreeCommit ? '#f0fdf4' : 'transparent'
                  }}
                >
                  {agreeCommit ? (
                    <CheckSquare size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '1px' }} />
                  ) : (
                    <Square size={20} color="#9ca3af" style={{ flexShrink: 0, marginTop: '1px' }} />
                  )}
                  <span style={{ fontSize: '0.88rem', color: '#374151', lineHeight: '1.4' }}>
                    Tôi cam kết làm việc tại Doanh nghiệp nếu trúng tuyển
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={onClose}
                  disabled={submitting}
                  style={{
                    padding: '0.7rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#e5e7eb'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#f3f4f6'; }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !cvFile || !agreeShare || !agreeCommit}
                  style={{
                    padding: '0.7rem 1.5rem',
                    background: (!cvFile || !agreeShare || !agreeCommit) ? '#d1d5db' : 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: (!cvFile || !agreeShare || !agreeCommit) ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: (!cvFile || !agreeShare || !agreeCommit) ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Nộp CV
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default JobApplyModal;
