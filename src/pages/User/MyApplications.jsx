import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { motion } from 'framer-motion';
import { Briefcase, FileText, Eye, Search, ChevronLeft, ChevronRight, ExternalLink, Download, ShieldCheck, FileCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  applied: { label: 'Đã nộp', color: '#eab308', bg: '#fefce8', border: '#fde047', description: 'Ứng tuyển thành công CV và được hệ thống ghi nhận.' },
  reviewing: { label: 'Đang xử lý', color: '#f97316', bg: '#fff7ed', border: '#fdba74', description: 'CV đã được gửi tới Doanh nghiệp (Dự kiến xử lý trong 7 - 10 ngày làm việc).' },
  accepted: { label: 'Trúng tuyển', color: '#16a34a', bg: '#f0fdf4', border: '#86efac', description: 'Có kết quả trúng tuyển và được Doanh nghiệp tiếp nhận.' },
  rejected: { label: 'Không trúng tuyển', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', description: 'Không trúng tuyển Doanh nghiệp đã ứng tuyển trên.' },
  interviewing: { label: 'Đang phỏng vấn', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', description: 'Đang trong quá trình phỏng vấn.' }
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('applications');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('candidate_id', session.user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Fetch job details and company info for each application
      const enrichedApps = await Promise.all((data || []).map(async (app) => {
        // Get job info
        const { data: jobData } = await supabase
          .from('jobs')
          .select('title, recruiter_id, created_at')
          .eq('id', app.job_id)
          .maybeSingle();

        let companyName = 'N/A';
        if (jobData) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('company_name')
            .eq('recruiter_id', jobData.recruiter_id)
            .maybeSingle();
          if (companyData) companyName = companyData.company_name;
        }

        // Get CV info (Ưu tiên đọc trực tiếp từ bảng job_applications để không bị phụ thuộc vào bảng cvs của Phân tích CV)
        let cvUrl = app.cv_url || null;
        let cvFileName = app.cv_file_name || null;
        if (!cvUrl && app.cv_id) {
          const { data: cvData } = await supabase
            .from('cvs')
            .select('file_url, file_name')
            .eq('id', app.cv_id)
            .maybeSingle();
          if (cvData) {
            cvUrl = cvData.file_url;
            cvFileName = cvData.file_name;
          }
        }

        return {
          ...app,
          jobTitle: jobData?.title || 'N/A',
          companyName,
          cvUrl,
          cvFileName,
          appliedAt: new Date(app.applied_at).toLocaleString('vi-VN'),
          updatedAt: new Date(app.applied_at).toLocaleString('vi-VN')
        };
      }));

      setApplications(enrichedApps);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplication = async (appId, jobTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa/hủy hồ sơ ứng tuyển cho công việc "${jobTitle}"? Sau khi xóa bạn có thể nộp lại CV mới cho vị trí này ngay lập tức!`)) {
      return;
    }
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', appId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('Cảnh báo bảo mật RLS trên Supabase đang chặn Xóa! Bạn vui lòng vào Supabase chạy file enable_candidate_delete_application.sql để cho phép ứng viên tự xóa bản ghi nhen!', { duration: 6000 });
        return;
      }

      setApplications(prev => prev.filter(a => a.id !== appId));
      toast.success('Đã xóa hồ sơ ứng tuyển thành công! Bạn đã có thể nộp lại CV mới rồi nhé! 🎉');
    } catch (err) {
      console.error('Lỗi khi xóa hồ sơ ứng tuyển:', err);
      toast.error('Có lỗi xảy ra khi xóa hồ sơ ứng tuyển: ' + (err.message || 'Unknown error'));
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const filteredApps = applications.filter(app =>
    app.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
    app.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div
      className="section"
      style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container">
        {/* Header */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(194, 65, 12, 0.1))',
            color: '#EA580C',
            padding: '0.5rem 1.25rem',
            borderRadius: '50px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'inline-block',
            fontSize: '0.85rem'
          }}>
            Quản lý ứng tuyển
          </span>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--color-charcoal)',
            letterSpacing: '-1px',
            marginBottom: '1rem',
            fontFamily: 'var(--font-heading)'
          }}>
            Hồ sơ ứng tuyển của tôi
          </h1>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '0', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('applications')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'applications' ? 'white' : 'transparent',
              border: activeTab === 'applications' ? '1px solid #e5e7eb' : '1px solid transparent',
              borderBottom: activeTab === 'applications' ? '2px solid #EA580C' : '1px solid #e5e7eb',
              borderRadius: '12px 12px 0 0',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              color: activeTab === 'applications' ? '#EA580C' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <Briefcase size={16} />
            Ứng tuyển việc làm
          </button>
          <button
            onClick={() => setActiveTab('my-cv')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'my-cv' ? 'white' : 'transparent',
              border: activeTab === 'my-cv' ? '1px solid #e5e7eb' : '1px solid transparent',
              borderBottom: activeTab === 'my-cv' ? '2px solid #EA580C' : '1px solid #e5e7eb',
              borderRadius: '12px 12px 0 0',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              color: activeTab === 'my-cv' ? '#EA580C' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} />
            CV của tôi
          </button>
        </motion.div>

        {activeTab === 'applications' && (
          <motion.div variants={itemVariants}>
            {/* Search & Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Tìm kiếm:</span>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Nhập tên vị trí..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    style={{
                      padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      width: '220px',
                      transition: 'border 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#EA580C'}
                    onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Hiển thị</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{
                    padding: '0.4rem 0.6rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>dữ liệu</span>
              </div>
            </div>

            {/* Table */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ overflowX: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Đang tải dữ liệu...</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={thStyle}>STT</th>
                        <th style={thStyle}>Tên vị trí ứng tuyển</th>
                        <th style={thStyle}>Doanh Nghiệp</th>
                        <th style={thStyle}>Ngày tạo</th>
                        <th style={thStyle}>Cập nhật lần cuối</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
                        <th style={thStyle}>Ghi chú</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedApps.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                            Chưa có hồ sơ ứng tuyển nào.
                            <br />
                            <Link to="/jobs" style={{ color: '#EA580C', fontWeight: 600, textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>
                              Khám phá việc làm →
                            </Link>
                          </td>
                        </tr>
                      ) : (
                        paginatedApps.map((app, index) => {
                          const status = STATUS_MAP[app.status] || STATUS_MAP.applied;
                          return (
                            <tr
                              key={app.id}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                transition: 'background 0.15s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = '#fafbfc'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={tdStyle}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td style={{ ...tdStyle, fontWeight: 600, color: '#1f2937', maxWidth: '200px' }}>{app.jobTitle}</td>
                              <td style={tdStyle}>{app.companyName}</td>
                              <td style={{ ...tdStyle, fontSize: '0.82rem' }}>{formatDate(app.applied_at)}</td>
                              <td style={{ ...tdStyle, fontSize: '0.82rem' }}>{formatDate(app.applied_at)}</td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '0.3rem 0.85rem',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: status.color,
                                  background: status.bg,
                                  border: `1px solid ${status.border}`,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {status.label}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, maxWidth: '160px', fontSize: '0.85rem', color: '#6b7280' }}>
                                {app.recruiter_notes || '—'}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                                  {app.cvUrl ? (
                                    <a
                                      href={app.cvUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Xem CV đã nộp"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: '#eff6ff',
                                        color: '#3b82f6',
                                        transition: 'all 0.2s',
                                        border: '1px solid #bfdbfe',
                                        textDecoration: 'none'
                                      }}
                                      onMouseOver={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = 'white'; }}
                                      onMouseOut={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; }}
                                    >
                                      <Eye size={15} />
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>—</span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteApplication(app.id, app.jobTitle)}
                                    title="Xóa / Hủy ứng tuyển để nộp lại CV khác"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '8px',
                                      background: '#fef2f2',
                                      color: '#ef4444',
                                      transition: 'all 0.2s',
                                      border: '1px solid #fca5a5',
                                      cursor: 'pointer'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {filteredApps.length > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1.25rem',
                  borderTop: '1px solid #e5e7eb',
                  fontSize: '0.85rem',
                  color: '#6b7280'
                }}>
                  <span>
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} tới {Math.min(currentPage * itemsPerPage, filteredApps.length)} của {filteredApps.length} dữ liệu
                  </span>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '0.4rem 0.8rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        color: currentPage === 1 ? '#d1d5db' : '#374151',
                        fontSize: '0.82rem',
                        fontWeight: 500
                      }}
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        style={{
                          padding: '0.4rem 0.7rem',
                          border: '1px solid',
                          borderColor: currentPage === i + 1 ? '#3b82f6' : '#d1d5db',
                          borderRadius: '6px',
                          background: currentPage === i + 1 ? '#3b82f6' : 'white',
                          color: currentPage === i + 1 ? 'white' : '#374151',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '0.4rem 0.8rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        color: currentPage === totalPages ? '#d1d5db' : '#374151',
                        fontSize: '0.82rem',
                        fontWeight: 500
                      }}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status Legend */}
            <motion.div
              variants={itemVariants}
              style={{
                marginTop: '2rem',
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem 2rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid #e5e7eb'
              }}
            >
              <h4 style={{ marginBottom: '1rem', color: '#374151', fontWeight: 700, fontSize: '1rem' }}>
                Chú giải trạng thái
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(STATUS_MAP).filter(([k]) => k !== 'interviewing').map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: val.color,
                      background: val.bg,
                      border: `1px solid ${val.border}`,
                      whiteSpace: 'nowrap',
                      minWidth: '120px',
                      textAlign: 'center',
                      flexShrink: 0
                    }}>
                      {val.label}
                    </span>
                    <span style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: '1.5' }}>
                      {val.description}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'my-cv' && (
          <motion.div variants={itemVariants}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={thStyle}>STT</th>
                      <th style={thStyle}>Tên file CV đã nộp</th>
                      <th style={thStyle}>Vị trí ứng tuyển</th>
                      <th style={thStyle}>Doanh nghiệp</th>
                      <th style={thStyle}>Ngày ứng tuyển</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '3.5rem', textAlign: 'center', color: '#9ca3af' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
                          Chưa có file CV ứng tuyển nào được lưu.
                          <br />
                          <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block', marginTop: '0.4rem' }}>
                            Khi bạn nộp CV ứng tuyển vào công việc bất kỳ, file CV gốc sẽ tự động được lưu trữ vĩnh viễn tại đây.
                          </span>
                          <Link to="/jobs" style={{ color: '#EA580C', fontWeight: 600, textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>
                            Khám phá việc làm →
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      applications.map((app, index) => (
                        <tr
                          key={app.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#fafbfc'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={tdStyle}>{index + 1}</td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileCheck size={18} color="#EA580C" style={{ flexShrink: 0 }} />
                              <span>{app.cvFileName || 'CV Ứng Tuyển.pdf'}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, color: '#334155', fontWeight: 600 }}>{app.jobTitle}</td>
                          <td style={{ ...tdStyle, color: '#64748b' }}>{app.companyName}</td>
                          <td style={{ ...tdStyle, fontSize: '0.82rem', color: '#64748b' }}>{app.appliedAt}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                              {app.cvUrl ? (
                                <>
                                  <a
                                    href={app.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Xem trực tuyến CV"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '34px',
                                      height: '34px',
                                      borderRadius: '8px',
                                      background: '#eff6ff',
                                      color: '#3b82f6',
                                      transition: 'all 0.2s',
                                      border: '1px solid #bfdbfe',
                                      textDecoration: 'none'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = 'white'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; }}
                                  >
                                    <Eye size={16} />
                                  </a>
                                  <a
                                    href={app.cvUrl}
                                    download={app.cvFileName || 'CV-Ung-Tuyen.pdf'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Tải về máy"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '34px',
                                      height: '34px',
                                      borderRadius: '8px',
                                      background: '#f0fdf4',
                                      color: '#16a34a',
                                      transition: 'all 0.2s',
                                      border: '1px solid #86efac',
                                      textDecoration: 'none'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = 'white'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; }}
                                  >
                                    <Download size={16} />
                                  </a>
                                </>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontStyle: 'italic' }}>Không có tệp</span>
                              )}
                              <button
                                onClick={() => handleDeleteApplication(app.id, app.jobTitle)}
                                title="Xóa / Hủy nộp CV để nộp lại hồ sơ khác"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '8px',
                                  background: '#fef2f2',
                                  color: '#ef4444',
                                  transition: 'all 0.2s',
                                  border: '1px solid #fca5a5',
                                  cursor: 'pointer'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const thStyle = {
  padding: '0.85rem 1rem',
  fontWeight: 600,
  color: '#475569',
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '0.75rem 1rem',
  color: '#4b5563',
  fontSize: '0.88rem'
};

export default MyApplications;
