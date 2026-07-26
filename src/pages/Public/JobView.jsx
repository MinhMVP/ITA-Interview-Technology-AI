import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Briefcase, DollarSign, MapPin, Clock, Calendar, Upload } from 'lucide-react';
import JobApplyModal from './JobApplyModal';

const JobView = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchJob();
    checkAuth();
  }, [jobId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const handleApplyClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setShowApplyModal(true);
  };

  const fetchJob = async () => {
    try {
      setLoading(true);
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
        
      if (jobError) throw jobError;
      
      let companyInfo = { company_name: 'Unknown', email: '' };
      
      if (jobData) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('id, company_name, email, logo_url')
          .eq('recruiter_id', jobData.recruiter_id)
          .maybeSingle();
          
        if (companyData) companyInfo = companyData;

        let contactEmail = companyInfo.email;
        if (!contactEmail && jobData.recruiter_id) {
          const { data: recProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', jobData.recruiter_id)
            .maybeSingle();
          if (recProfile?.email) contactEmail = recProfile.email;
        }

        setJob({
          id: jobData.id,
          title: jobData.title,
          recruiterId: jobData.recruiter_id,
          companyId: companyInfo.id,
          company: companyInfo.company_name || 'Doanh nghiệp',
          companyLogo: companyInfo.logo_url,
          contactEmail: contactEmail,
          type: jobData.job_type,
          location: jobData.location,
          salary: jobData.salary_range,
          posted: new Date(jobData.created_at).toLocaleDateString(),
          description: jobData.description,
          requirements: jobData.requirements,
          status: jobData.status
        });
      }
    } catch (err) {
      console.error(err);
      setError('Could not find this job posting.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading...</div>;
  if (error || !job) return <div style={{ textAlign: 'center', padding: '5rem', color: '#d9534f' }}>{error || 'Job not found'}</div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
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
      <div className="container container--narrow">
        
        <motion.div variants={itemVariants} style={{ marginBottom: '2rem' }}>
          <Link to="/jobs" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            textDecoration: 'none', 
            color: 'var(--color-charcoal)', 
            fontSize: '0.95rem', 
            fontWeight: 600, 
            background: 'var(--color-warm-white)',
            padding: '0.6rem 1.25rem 0.6rem 0.6rem',
            borderRadius: '50px',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 12px rgba(44, 40, 36, 0.04)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
          }} 
          onMouseOver={(e) => { 
            e.currentTarget.style.transform = 'translateY(-2px)'; 
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(44, 40, 36, 0.08)'; 
            e.currentTarget.style.color = '#EA580C'; 
            e.currentTarget.querySelector('.icon-wrapper').style.background = '#EA580C';
            e.currentTarget.querySelector('.icon-wrapper').style.color = 'white';
          }} 
          onMouseOut={(e) => { 
            e.currentTarget.style.transform = 'translateY(0)'; 
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(44, 40, 36, 0.04)'; 
            e.currentTarget.style.color = 'var(--color-charcoal)'; 
            e.currentTarget.querySelector('.icon-wrapper').style.background = 'var(--color-cream)';
            e.currentTarget.querySelector('.icon-wrapper').style.color = 'var(--color-charcoal)';
          }}>
            <span className="icon-wrapper" style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '50%', 
              background: 'var(--color-cream)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-charcoal)',
              transition: 'all 0.3s ease'
            }}>
              <ArrowLeft size={16} />
            </span>
            Quay về trang Việc làm
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px', boxShadow: '0 20px 40px rgba(44, 40, 36, 0.05)' }}>
          <div style={{ padding: '4rem 3rem 3rem', background: 'var(--color-warm-white)', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
            {job.status === 'closed' && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '0.4rem 1rem', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid #ffcdd2' }}>
                ĐÃ NGỪNG TUYỂN DỤNG
              </div>
            )}
            
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'left' }}>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '1.5rem', lineHeight: '1.25', color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                {job.title}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                <Link to={`/company/${job.companyId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-charcoal)', fontWeight: '600', textDecoration: 'none' }} onMouseOver={(e) => e.currentTarget.style.color = '#EA580C'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-charcoal)'}>
                  <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--color-accent-vivid), var(--color-accent))', 
                      color: 'white',
                      overflow: 'hidden',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
                    }}>
                      {job.companyLogo ? <img src={job.companyLogo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (job.company || 'C').charAt(0).toUpperCase()}
                  </div>
                  {job.company}
                </Link>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}><MapPin size={16} /> {job.location || 'N/A'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}><Clock size={16} /> {job.posted}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '3rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              <div style={{ padding: '1.5rem', background: 'var(--color-cream)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.1)', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem', fontWeight: 600 }}>Loại hình</span>
                  <strong style={{ color: 'var(--color-charcoal)', fontSize: '1.1rem' }}>{job.type || 'N/A'}</strong>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem', background: 'var(--color-cream)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(107, 127, 92, 0.1)', color: 'var(--color-moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem', fontWeight: 600 }}>Mức lương</span>
                  <strong style={{ color: 'var(--color-charcoal)', fontSize: '1.1rem' }}>{job.salary || 'Thỏa thuận'}</strong>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Mô tả công việc</h3>
              <div style={{ whiteSpace: 'pre-line', color: 'var(--color-text)', lineHeight: '1.8', fontSize: '1.05rem', fontFamily: 'var(--font-sans)' }}>
                {job.description}
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Yêu cầu ứng viên</h3>
              <div style={{ whiteSpace: 'pre-line', color: 'var(--color-text)', lineHeight: '1.8', fontSize: '1.05rem', fontFamily: 'var(--font-sans)' }}>
                {job.requirements}
              </div>
            </div>
          </div>

          <div style={{ padding: '3rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', background: 'var(--color-surface-alt)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Cách thức ứng tuyển</h3>
            <p style={{ marginBottom: '2rem', color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
              Để ứng tuyển cho vị trí này, vui lòng nộp CV trực tiếp trên hệ thống. Doanh nghiệp sẽ xem xét và phản hồi kết quả.
            </p>
            {job.status !== 'closed' ? (
              <button
                onClick={handleApplyClick}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
                  background: '#EA580C', color: 'white',
                  padding: '1rem 2rem', borderRadius: '50px', fontWeight: 600, fontSize: '1.05rem',
                  boxShadow: '0 4px 15px rgba(234, 88, 12, 0.3)', transition: 'all 0.3s ease',
                  border: 'none', cursor: 'pointer'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 88, 12, 0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(234, 88, 12, 0.3)'; }}
              >
                Nộp CV Ứng Tuyển <Upload size={18} />
              </button>
            ) : (
              <span style={{ color: '#d9534f', fontWeight: 600, padding: '1rem', background: '#ffebee', borderRadius: '12px', display: 'inline-block' }}>Vị trí này đã ngừng tuyển dụng.</span>
            )}
          </div>

        </motion.div>
      </div>

      {/* Job Apply Modal */}
      <JobApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        job={job}
        onSuccess={() => {
          // Optionally refresh or show success state
        }}
      />
    </motion.div>
  );
};

export default JobView;
