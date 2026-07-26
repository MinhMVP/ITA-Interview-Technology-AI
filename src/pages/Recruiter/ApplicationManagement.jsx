import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useConfirm } from '../../utils/ConfirmContext';
import { Eye, CheckCircle, XCircle, Clock, FileText, Search, ChevronDown, MessageSquare, Download } from 'lucide-react';

const STATUS_CONFIG = {
  applied: { label: 'Đã nộp', color: '#eab308', bg: '#fefce8', border: '#fde047' },
  reviewing: { label: 'Đang xử lý', color: '#f97316', bg: '#fff7ed', border: '#fdba74' },
  accepted: { label: 'Trúng tuyển', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  rejected: { label: 'Không trúng tuyển', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  interviewing: { label: 'Đang phỏng vấn', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' }
};

const ApplicationManagement = () => {
  const confirm = useConfirm();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [noteModal, setNoteModal] = useState(null); // { appId, currentNote }
  const [noteText, setNoteText] = useState('');
  const [cvPreview, setCvPreview] = useState(null); // { url, name }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch recruiter's jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, status, created_at')
        .eq('recruiter_id', session.user.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      if (!jobsData || jobsData.length === 0) {
        setApplications([]);
        return;
      }

      // Fetch applications for all jobs
      const jobIds = jobsData.map(j => j.id);
      const { data: appsData, error: appsError } = await supabase
        .from('job_applications')
        .select('*')
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      // Enrich with candidate info and CV data
      const enrichedApps = await Promise.all((appsData || []).map(async (app) => {
        // Get candidate profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', app.candidate_id)
          .maybeSingle();

        // Get CV info (Ưu tiên đọc trực tiếp từ bảng job_applications để không phụ thuộc vào bảng cvs)
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

        // Get job title
        const jobInfo = jobsData.find(j => j.id === app.job_id);

        return {
          ...app,
          candidateName: profile?.full_name || 'Ứng viên',
          candidateEmail: profile?.email || '',
          candidateAvatar: profile?.avatar_url,
          jobTitle: jobInfo?.title || 'N/A',
          cvUrl,
          cvFileName
        };
      }));

      setApplications(enrichedApps);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId, newStatus, label) => {
    const isConfirmed = await new Promise(resolve =>
      confirm({
        message: `Bạn có chắc muốn chuyển trạng thái sang "${label}"?`,
        isDanger: newStatus === 'rejected',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      })
    );
    if (!isConfirmed) return;

    // Optimistic update
    setApplications(prev =>
      prev.map(app => app.id === appId ? { ...app, status: newStatus } : app)
    );

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', appId);

      if (error) throw error;

      // Gửi thông báo tới chuông thông báo (notifications) của ứng viên
      const targetApp = applications.find(a => a.id === appId);
      if (targetApp && targetApp.candidate_id) {
        try {
          await supabase.from('notifications').insert([{
            user_id: targetApp.candidate_id,
            title: `Cập nhật trạng thái ứng tuyển: ${targetApp.jobTitle} 📢`,
            content: `Hồ sơ CV của bạn cho vị trí "${targetApp.jobTitle}" đã được thay đổi sang trạng thái: "${label}".`,
            type: newStatus === 'accepted' ? 'success' : newStatus === 'rejected' ? 'warning' : 'info',
            action_link: '/my-applications'
          }]);
        } catch (notifErr) {
          console.error("Lỗi khi gửi thông báo cho ứng viên:", notifErr);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Lỗi: ' + err.message);
      fetchData();
    }
  };

  const saveNote = async () => {
    if (!noteModal) return;
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ recruiter_notes: noteText })
        .eq('id', noteModal.appId);

      if (error) throw error;

      setApplications(prev =>
        prev.map(app => app.id === noteModal.appId ? { ...app, recruiter_notes: noteText } : app)
      );
      setNoteModal(null);
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Lỗi: ' + err.message);
    }
  };

  // Filter applications
  const filteredApps = applications.filter(app => {
    if (selectedJob !== 'all' && app.job_id !== selectedJob) return false;
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (search && !app.candidateName.toLowerCase().includes(search.toLowerCase()) &&
        !app.candidateEmail.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Count by status
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        {/* Back link */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/recruiter" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            ← Về trang Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="label">Recruiter Portal</span>
            <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Quản lý CV ứng viên</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'interviewing').map(([key, config]) => (
            <div
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
              style={{
                background: filterStatus === key ? config.bg : 'white',
                border: `2px solid ${filterStatus === key ? config.border : '#e5e7eb'}`,
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: config.color }}>
                {statusCounts[key] || 0}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginTop: '0.2rem' }}>
                {config.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Tìm ứng viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
                width: '220px'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#EA580C'}
              onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
            />
          </div>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.85rem',
              outline: 'none',
              minWidth: '200px',
              background: 'white'
            }}
          >
            <option value="all">Tất cả vị trí ({applications.length})</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title} ({applications.filter(a => a.job_id === job.id).length})
              </option>
            ))}
          </select>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                padding: '0.5rem 1rem',
                background: '#fee2e2',
                color: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              ✕ Bỏ lọc trạng thái
            </button>
          )}
        </div>

        {/* Applications Table */}
        <div className="glass-card reveal is-visible" style={{ padding: '0' }}>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-warm-white)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Ứng viên</th>
                    <th style={thStyle}>Vị trí</th>
                    <th style={thStyle}>Ngày nộp</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
                    <th style={thStyle}>Ghi chú</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                        Chưa có ứng viên nào.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app, index) => {
                      const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
                      return (
                        <tr
                          key={app.id}
                          style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                          className="job-row"
                        >
                          <td style={tdStyle}>{index + 1}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                                overflow: 'hidden'
                              }}>
                                {app.candidateAvatar ? (
                                  <img src={app.candidateAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  (app.candidateName || 'U').charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem' }}>{app.candidateName}</div>
                                <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{app.candidateEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{app.jobTitle}</td>
                          <td style={{ ...tdStyle, fontSize: '0.82rem', color: '#6b7280' }}>
                            {new Date(app.applied_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: statusInfo.color,
                              background: statusInfo.bg,
                              border: `1px solid ${statusInfo.border}`,
                              whiteSpace: 'nowrap'
                            }}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, maxWidth: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.82rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.recruiter_notes || '—'}
                              </span>
                              <button
                                onClick={() => { setNoteModal({ appId: app.id, currentNote: app.recruiter_notes }); setNoteText(app.recruiter_notes || ''); }}
                                title="Thêm/Sửa ghi chú"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#9ca3af',
                                  padding: '0.2rem',
                                  flexShrink: 0
                                }}
                              >
                                <MessageSquare size={14} />
                              </button>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                              {/* View CV */}
                              {app.cvUrl && (
                                <button
                                  onClick={() => setCvPreview({ url: app.cvUrl, name: app.cvFileName || 'CV' })}
                                  title="Xem CV"
                                  style={actionBtnStyle('#3b82f6', '#eff6ff', '#bfdbfe')}
                                  onMouseOver={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = 'white'; }}
                                  onMouseOut={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; }}
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              {/* Mark as reviewing */}
                              {app.status === 'applied' && (
                                <button
                                  onClick={() => updateStatus(app.id, 'reviewing', 'Đang xử lý')}
                                  title="Đánh dấu Đang xử lý"
                                  style={actionBtnStyle('#f97316', '#fff7ed', '#fdba74')}
                                  onMouseOver={e => { e.currentTarget.style.background = '#f97316'; e.currentTarget.style.color = 'white'; }}
                                  onMouseOut={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.color = '#f97316'; }}
                                >
                                  <Clock size={14} />
                                </button>
                              )}
                              {/* Accept */}
                              {(app.status === 'applied' || app.status === 'reviewing') && (
                                <button
                                  onClick={() => updateStatus(app.id, 'accepted', 'Trúng tuyển')}
                                  title="Chấp nhận - Trúng tuyển"
                                  style={actionBtnStyle('#16a34a', '#f0fdf4', '#86efac')}
                                  onMouseOver={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = 'white'; }}
                                  onMouseOut={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#16a34a'; }}
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              {/* Reject */}
                              {(app.status === 'applied' || app.status === 'reviewing') && (
                                <button
                                  onClick={() => updateStatus(app.id, 'rejected', 'Không trúng tuyển')}
                                  title="Từ chối - Không trúng tuyển"
                                  style={actionBtnStyle('#ef4444', '#fef2f2', '#fca5a5')}
                                  onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                  onMouseOut={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                                >
                                  <XCircle size={14} />
                                </button>
                              )}
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
        </div>
      </div>

      {/* Note Modal */}
      {noteModal && (
        <>
          <div
            onClick={() => setNoteModal(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)', zIndex: 9998
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: '16px',
            width: '90%', maxWidth: '450px', padding: '1.5rem',
            zIndex: 9999, boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1f2937', fontSize: '1.1rem' }}>
              <MessageSquare size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Ghi chú cho ứng viên
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              placeholder="Nhập ghi chú..."
              style={{
                width: '100%', padding: '0.75rem',
                border: '1px solid #d1d5db', borderRadius: '10px',
                fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#EA580C'}
              onBlur={e => e.currentTarget.style.borderColor = '#d1d5db'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => setNoteModal(null)}
                style={{
                  padding: '0.6rem 1.2rem', background: '#f3f4f6',
                  border: '1px solid #d1d5db', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                }}
              >
                Hủy
              </button>
              <button
                onClick={saveNote}
                style={{
                  padding: '0.6rem 1.2rem', background: '#EA580C',
                  color: 'white', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                }}
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </>
      )}

      {/* CV Preview Modal */}
      {cvPreview && (
        <>
          <div
            onClick={() => setCvPreview(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)', zIndex: 9998
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: '16px',
            width: '90%', maxWidth: '800px', height: '85vh',
            zIndex: 9999, boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#EA580C" />
                <span style={{ fontWeight: 600, color: '#1f2937' }}>{cvPreview.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={cvPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.4rem 0.8rem', background: '#eff6ff',
                    color: '#3b82f6', border: '1px solid #bfdbfe',
                    borderRadius: '6px', textDecoration: 'none',
                    fontSize: '0.82rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.3rem'
                  }}
                >
                  <Download size={14} /> Tải xuống
                </a>
                <button
                  onClick={() => setCvPreview(null)}
                  style={{
                    background: '#f3f4f6', border: 'none',
                    borderRadius: '6px', padding: '0.4rem 0.8rem',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                  }}
                >
                  ✕ Đóng
                </button>
              </div>
            </div>
            <iframe
              src={cvPreview.url}
              style={{ flex: 1, border: 'none', width: '100%' }}
              title="CV Preview"
            />
          </div>
        </>
      )}

      <style>{`
        .job-row:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
};

const thStyle = {
  padding: '0.85rem 1rem',
  fontWeight: '500',
  color: 'var(--color-text-secondary)',
  fontSize: '0.85rem',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.88rem'
};

const actionBtnStyle = (color, bg, border) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  borderRadius: '8px',
  background: bg,
  color: color,
  border: `1px solid ${border}`,
  cursor: 'pointer',
  transition: 'all 0.2s'
});

export default ApplicationManagement;
