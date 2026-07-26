import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const RecruiterDashboard = () => {
  const [companyStatus, setCompanyStatus] = useState(null); // 'pending', 'approved', 'rejected', or 'none'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyStatus();
  }, []);

  const fetchCompanyStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('companies')
        .select('status')
        .eq('recruiter_id', session.user.id)
        .single();
        
      if (data) {
        setCompanyStatus(data.status);
      } else {
        setCompanyStatus('none');
      }
    } catch (err) {
      console.error(err);
      setCompanyStatus('none');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <span className="label">Dashboard</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Recruiter Portal</h1>
          <p>Manage your company profile, job postings, and share knowledge through blogs.</p>
        </div>

        {companyStatus === 'pending' && (
          <div style={{ background: '#fff3cd', color: '#856404', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ffeeba' }}>
            <strong>Tài khoản doanh nghiệp của bạn đang chờ phê duyệt.</strong>
            <p style={{ marginTop: '0.5rem' }}>Bạn không thể đăng tin tuyển dụng hoặc blog cho đến khi Admin duyệt yêu cầu đăng ký của bạn. Vui lòng quay lại sau.</p>
          </div>
        )}

        <div className="grid-auto">
          {/* Company Profile Settings */}
          <Link to="/recruiter/company" className="glass-card reveal is-visible" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏢</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Company Profile</h3>
            <p style={{ fontSize: '0.9rem' }}>Update your company details, logo, and information visible to candidates.</p>
          </Link>

          {/* Job Management */}
          {companyStatus === 'approved' ? (
            <Link to="/recruiter/jobs" className="glass-card reveal is-visible reveal--delay-1" style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💼</div>
              <h3 style={{ marginBottom: '0.5rem' }}>Job Management</h3>
              <p style={{ fontSize: '0.9rem' }}>Post new job openings and manage existing ones.</p>
            </Link>
          ) : (
            <div className="glass-card reveal is-visible reveal--delay-1" style={{ display: 'block', opacity: 0.5, cursor: 'not-allowed' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💼</div>
              <h3 style={{ marginBottom: '0.5rem' }}>Job Management</h3>
              <p style={{ fontSize: '0.9rem' }}>(Khóa) Post new job openings and manage existing ones.</p>
            </div>
          )}

          {/* Blog Management */}
          {companyStatus === 'approved' ? (
            <Link to="/recruiter/blogs" className="glass-card reveal is-visible reveal--delay-2" style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
              <h3 style={{ marginBottom: '0.5rem' }}>Blog Management</h3>
              <p style={{ fontSize: '0.9rem' }}>Share interview tips, company culture, and news through articles and videos.</p>
            </Link>
          ) : (
            <div className="glass-card reveal is-visible reveal--delay-2" style={{ display: 'block', opacity: 0.5, cursor: 'not-allowed' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
              <h3 style={{ marginBottom: '0.5rem' }}>Blog Management</h3>
              <p style={{ fontSize: '0.9rem' }}>(Khóa) Share interview tips, company culture, and news through articles and videos.</p>
            </div>
          )}

          {/* Application Management */}
          {companyStatus === 'approved' ? (
            <Link to="/recruiter/applications" className="glass-card reveal is-visible reveal--delay-3" style={{ display: 'block', textDecoration: 'none' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ marginBottom: '0.5rem' }}>Quản lý CV ứng viên</h3>
              <p style={{ fontSize: '0.9rem' }}>Xem xét CV ứng tuyển, phê duyệt hoặc từ chối ứng viên cho các vị trí tuyển dụng.</p>
            </Link>
          ) : (
            <div className="glass-card reveal is-visible reveal--delay-3" style={{ display: 'block', opacity: 0.5, cursor: 'not-allowed' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ marginBottom: '0.5rem' }}>Quản lý CV ứng viên</h3>
              <p style={{ fontSize: '0.9rem' }}>(Khóa) Xem xét CV ứng tuyển, phê duyệt hoặc từ chối ứng viên.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
