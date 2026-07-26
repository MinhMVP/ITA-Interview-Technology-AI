import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  // Debugging log to see if user state is populated
  useEffect(() => {
    console.log("Current user state in Header:", user);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isMentor = profile?.role?.toLowerCase() === 'mentor' || user?.user_metadata?.role?.toLowerCase() === 'mentor';
  const isRecruiter = profile?.role?.toLowerCase() === 'recruiter' || profile?.role?.toLowerCase() === 'company';
  const isAdmin = profile?.role?.toLowerCase() === 'admin' || user?.user_metadata?.role?.toLowerCase() === 'admin';

  let navLinks = [];

  const isCandidate = !isMentor && !isAdmin && !isRecruiter;

  if (isRecruiter) {
    navLinks = [
      { to: '/recruiter', label: 'Recruiter Portal' },
      { to: '/blogs', label: 'Blog' },
      { to: '/jobs', label: 'Việc làm' }
    ];
  } else if (isCandidate) {
    navLinks = [
      { to: '/interview', label: 'Phỏng vấn' },
      { to: '/cv-analysis', label: 'Phân tích CV' },
      { to: '/dashboard', label: 'Thử thách' },
      {
        label: 'Khám phá',
        dropdown: [
          { to: '/mentors', label: 'Tìm Mentors', desc: 'Kết nối với mentor chuyên nghiệp' },
          { to: '/blogs', label: 'Blog', desc: 'Chia sẻ kinh nghiệm phỏng vấn' },
          { to: '/jobs', label: 'Việc làm', desc: 'Tìm kiếm cơ hội nghề nghiệp' },
          { to: '/my-applications', label: 'Hồ sơ ứng tuyển', desc: 'Theo dõi trạng thái CV đã nộp' },
          { to: '/mentor-register', label: 'Đăng ký Mentor', desc: 'Chia sẻ kiến thức của bạn' },
          { to: '/recruiter-register', label: 'Dành cho doanh nghiệp', desc: 'Đăng tin tuyển dụng' }
        ]
      },
      { to: '/pricing', label: 'Gói dịch vụ' }
    ];
  } else {
    navLinks = [
      { to: '/interview', label: 'Phỏng vấn' },
      { to: '/cv-analysis', label: 'Phân tích CV' }
    ];

    if (!isAdmin) {
      navLinks.push({ to: '/mentors', label: 'Mentors' });
    }
    navLinks.push({ to: '/jobs', label: 'Việc làm' });

    if (!isMentor) {
      navLinks.push({ to: '/pricing', label: 'Gói dịch vụ' });
    }

    navLinks.push({ to: '/blogs', label: 'Blog' });

    if (isAdmin) {
      navLinks.push({ to: '/admin', label: 'Quản trị' });
    }

    if (isMentor) {
      navLinks.push({ to: '/mentor', label: 'Mentor Portal' });
    }
  }

  return (
    <header id="main-header" style={{
      position: 'fixed',
      top: '1.2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 3rem)',
      maxWidth: '1200px',
      zIndex: 1000,
      padding: '0.55rem 2rem',
      background: scrolled ? 'rgba(250, 248, 245, 0.75)' : 'rgba(250, 248, 245, 0.5)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      border: scrolled ? '1px solid rgba(255, 255, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.35)',
      borderRadius: '9999px',
      boxShadow: scrolled
        ? '0 20px 50px rgba(44, 40, 36, 0.1), 0 0 0 1px rgba(44, 40, 36, 0.03)'
        : '0 10px 30px rgba(44, 40, 36, 0.04)',
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          color: 'var(--color-charcoal)',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading, var(--font-serif))',
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, var(--color-charcoal), var(--color-earth-dark))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ita.
          </span>
          <span style={{
            fontSize: '0.52rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            borderLeft: '1.5px solid rgba(44, 40, 36, 0.12)',
            paddingLeft: '10px',
            lineHeight: '1.3'
          }} className="logo-subtitle">
            Interview<br />Technology AI
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{
          display: 'flex',
          gap: '1.8rem',
          alignItems: 'center',
        }} className="desktop-nav">
          {navLinks.map((link, idx) => (
            link.dropdown ? (
              <div key={idx} className="nav-dropdown" style={{ position: 'relative' }}>
                <span style={{
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }} className="nav-link-item">
                  {link.label}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
                    <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="nav-dropdown-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%) translateY(12px)',
                  background: 'var(--color-warm-white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  boxShadow: '0 20px 60px rgba(44, 40, 36, 0.12), 0 0 0 1px rgba(44, 40, 36, 0.03)',
                  padding: '0.75rem',
                  minWidth: '260px',
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem'
                }}>
                  {link.dropdown.map(subItem => (
                    <Link
                      key={subItem.to}
                      to={subItem.to}
                      style={{
                        padding: '0.8rem 1.2rem',
                        textDecoration: 'none',
                        color: 'var(--color-charcoal)',
                        borderRadius: '12px',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        borderLeft: '3px solid transparent'
                      }}
                      className="dropdown-link-item"
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', transition: 'color 0.3s ease' }} className="dropdown-title">{subItem.label}</span>
                      {subItem.desc && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          fontWeight: 500,
                          opacity: 0.85
                        }}>{subItem.desc}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  textDecoration: 'none',
                  color: location.pathname === link.to ? 'var(--color-charcoal)' : 'var(--color-text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: location.pathname === link.to ? 600 : 500,
                  letterSpacing: '0',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                className="nav-link-item"
              >
                {link.label}
              </Link>
            )
          ))}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <NotificationDropdown user={user} />
              <Link 
                to={
                  profile?.role === 'mentor' || user?.user_metadata?.role === 'mentor' 
                    ? '/mentor/profile' 
                    : '/profile'
                } 
                style={{
                  textDecoration: 'none',
                  color: 'var(--color-charcoal)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }} className="nav-link-item">
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-accent-vivid), var(--color-accent))',
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '13px',
                  boxShadow: '0 2px 8px rgba(224, 122, 75, 0.3)',
                }}>
                  {user.user_metadata?.full_name
                    ? user.user_metadata.full_name.charAt(0).toUpperCase()
                    : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                </div>
                <span>
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                {profile?.role?.toLowerCase() === 'admin' ? (
                  <span style={{
                    background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    marginLeft: '2px',
                    boxShadow: '0 0 8px rgba(217, 119, 6, 0.4)'
                  }}>
                    ADMIN
                  </span>
                ) : isMentor ? (
                  <span style={{
                    background: 'var(--color-moss, #6B7F5C)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    marginLeft: '2px'
                  }}>
                    MENTOR
                  </span>
                ) : profile?.role === 'recruiter' ? (
                  <span style={{
                    background: '#0ea5e9',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    marginLeft: '2px'
                  }}>
                    COMPANY
                  </span>
                ) : profile?.plan && profile.plan !== 'Free' && (
                  <span style={{
                    background: profile.plan === 'Premium' ? '#ff9632' : (profile.plan === 'Pro' ? '#32c864' : '#e2e8f0'),
                    color: profile.plan === 'Premium' ? 'white' : (profile.plan === 'Pro' ? 'white' : '#64748b'),
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    marginLeft: '2px'
                  }}>
                    {profile.plan}
                  </span>
                )}
              </Link>
              <button onClick={handleLogout} style={{
                padding: '0.4rem 1.1rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: '9999px',
                border: '1px solid var(--border-color, #e0d5c1)',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-sans)',
              }} className="btn-logout-nav">
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn--vivid" style={{
              padding: '0.55rem 1.5rem',
              fontSize: '0.8rem',
              borderRadius: '9999px',
              fontWeight: 600,
            }}>
              Bắt đầu
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            position: 'relative',
            width: '32px',
            height: '32px',
            zIndex: 1001,
          }}
          className="mobile-toggle"
          aria-label="Menu"
        >
          <span style={{
            display: 'block',
            width: '20px',
            height: '1.5px',
            background: 'var(--color-charcoal)',
            transition: 'all 0.3s ease',
            transform: menuOpen ? 'rotate(45deg) translateY(0)' : 'translateY(-3px)',
            position: 'absolute',
            left: '6px',
          }} />
          <span style={{
            display: 'block',
            width: '20px',
            height: '1.5px',
            background: 'var(--color-charcoal)',
            transition: 'all 0.3s ease',
            transform: menuOpen ? 'rotate(-45deg) translateY(0)' : 'translateY(3px)',
            position: 'absolute',
            left: '6px',
          }} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-cream)',
        display: 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2.5rem',
        transform: menuOpen ? 'translateY(0)' : 'translateY(-100%)',
        visibility: menuOpen ? 'visible' : 'hidden',
        pointerEvents: menuOpen ? 'auto' : 'none',
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.6s',
        zIndex: 999,
      }} className="mobile-menu">
        {navLinks.map((link, idx) => (
          link.dropdown ? (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{link.label}</div>
              {link.dropdown.map(subItem => (
                <Link
                  key={subItem.to}
                  to={subItem.to}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    textDecoration: 'none',
                    color: 'var(--color-charcoal)',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.75rem',
                    transition: 'color 0.3s ease'
                  }}
                  className="mobile-nav-link"
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          ) : (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                textDecoration: 'none',
                color: 'var(--color-charcoal)',
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                transition: 'color 0.3s ease'
              }}
              className="mobile-nav-link"
            >
              {link.label}
            </Link>
          )
        ))}
        {user ? (
          <>
            <Link to="/profile" onClick={() => setMenuOpen(false)} style={{
              textDecoration: 'none',
              color: 'var(--color-accent-vivid)',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Xin chào, <span>
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                {profile?.role?.toLowerCase() === 'admin' && (
                  <span style={{
                    background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    boxShadow: '0 0 8px rgba(217, 119, 6, 0.6), 0 0 16px rgba(251, 191, 36, 0.4)'
                  }}>
                    ADMIN
                  </span>
                )}
                {isMentor && (
                  <span style={{
                    background: 'var(--color-moss, #6B7F5C)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    marginLeft: '4px'
                  }}>
                    MENTOR
                  </span>
                )}
            </Link>
            <button onClick={handleLogout} className="btn btn--outline" style={{
              padding: '0.6rem 2rem',
              borderRadius: '9999px',
              border: '1px solid var(--color-accent-vivid)',
              background: 'transparent',
              color: 'var(--color-accent-vivid)',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}>
              Đăng xuất
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn--vivid" onClick={() => setMenuOpen(false)} style={{
            padding: '0.8rem 2.5rem',
            fontSize: '1rem',
          }}>
            Bắt đầu
          </Link>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; align-items: center; justify-content: center; }
          .mobile-menu { display: flex !important; }
          .logo-subtitle { display: none !important; }
        }
        .nav-link-item {
          position: relative;
        }
        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 1.5px;
          background: var(--color-accent-vivid);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform: translateX(-50%);
          border-radius: 1px;
        }
        .nav-link-item:hover::after {
          width: 100%;
        }
        .nav-link-item:hover {
          color: var(--color-charcoal) !important;
        }
        .mobile-nav-link:hover {
          color: var(--color-accent-vivid) !important;
        }
        .btn-logout-nav:hover {
          background: var(--color-charcoal) !important;
          color: var(--color-cream) !important;
          border-color: var(--color-charcoal) !important;
        }
        .nav-dropdown:hover .nav-dropdown-menu {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateX(-50%) translateY(6px) !important;
        }
        .dropdown-link-item:hover {
          background: rgba(234, 88, 12, 0.04) !important;
          border-left: 3px solid var(--color-accent-vivid) !important;
          padding-left: 1.5rem !important;
        }
        .dropdown-link-item:hover .dropdown-title {
          color: var(--color-accent-vivid) !important;
        }
        .btn--vivid {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .btn--vivid:hover {
          box-shadow: 0 4px 15px rgba(224, 122, 75, 0.4) !important;
          transform: translateY(-1px);
        }
        .btn--vivid svg {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .btn--vivid:hover svg {
          transform: translateX(4px);
        }
      `}</style>
    </header>
  );
};

export default Header;
