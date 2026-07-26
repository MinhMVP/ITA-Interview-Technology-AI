import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './CardStackSection.css';
const videoProject3 = "https://hitcsegxyxvxpyusfyge.supabase.co/storage/v1/object/public/videos/Video_Project_3.mp4";
const videoProject4 = "https://hitcsegxyxvxpyusfyge.supabase.co/storage/v1/object/public/videos/Video_Project_4.mp4";
const videoProject7 = "https://hitcsegxyxvxpyusfyge.supabase.co/storage/v1/object/public/videos/Video_Project_7.mp4";
gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Tạo tài khoản',
    description: 'Đăng ký miễn phí, hoàn thiện hồ sơ và tải lên CV để AI hiểu rõ về bạn.',
    icon: '👤',
    accent: '#c4956a',
    video: videoProject3,
  },
  {
    number: '02',
    title: 'Chọn lĩnh vực',
    description: 'Lựa chọn vị trí, ngành nghề và cấp độ phỏng vấn phù hợp mục tiêu.',
    icon: '🎯',
    accent: '#35a78c',
    video: videoProject4,
  },
  {
    number: '03',
    title: 'Phỏng vấn & cải thiện',
    description: 'Tham gia phỏng vấn AI, nhận feedback chi tiết và liên tục cải thiện.',
    icon: '🚀',
    accent: '#d06b3e',
    video: videoProject7,
  },
];

const CardStackSection = () => {
  const wrapperRef = useRef(null);
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const cards = cardsRef.current.filter(Boolean);
    if (!cards.length) return;

    const ctx = gsap.context(() => {
      // 1. Initial Setup: Stack cards with offset, scale, and brightness
      cards.forEach((card, i) => {
        gsap.set(card, {
          y: i * 25, 
          scale: 1 - i * 0.05, 
          filter: `brightness(${1 - i * 0.3})`,
          zIndex: cards.length - i,
          opacity: 1
        });

        // Hide text for cards that are not at the front
        const sides = card.querySelectorAll('.card-stack-side');
        gsap.set(sides, { opacity: i === 0 ? 1 : 0 });
      });

      // 2. Create Timeline
      const tl = gsap.timeline();

      cards.forEach((card, index) => {
        if (index === cards.length - 1) return; 

        // Fade out text of the current card very quickly
        const currentSides = card.querySelectorAll('.card-stack-side');
        tl.to(currentSides, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.out'
        }, index);

        // Move current card UP and fade out
        tl.to(card, {
          y: -window.innerHeight * 0.3,
          opacity: 0,
          duration: 1,
          ease: 'power2.inOut'
        }, index); 

        // Move all subsequent cards FORWARD
        for (let j = index + 1; j < cards.length; j++) {
          const newPos = j - index - 1; 
          tl.to(cards[j], {
            y: newPos * 25,
            scale: 1 - newPos * 0.05,
            filter: `brightness(${1 - newPos * 0.3})`,
            duration: 1,
            ease: 'power2.inOut'
          }, index);

          // Manage side text opacity based on arrival position
          const sides = cards[j].querySelectorAll('.card-stack-side');
          if (newPos === 0) {
            tl.to(sides, {
              opacity: 1,
              duration: 0.3,
              ease: 'power2.in'
            }, index + 0.7);
          } else {
            tl.to(sides, {
              opacity: 0,
              duration: 1
            }, index);
          }
        }
      });

      // 3. Scrub + snap with scroll locking during transitions
      let lastCardIndex = 0;
      let animating = false;

      // Block user scroll input at DOM level during card transitions
      const blockScroll = (e) => { if (animating) e.preventDefault(); };

      ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top', 
        end: 'bottom bottom', 
        animation: tl,
        scrub: 0.6,
        onUpdate: (self) => {
          if (animating) return;

          const newIndex = Math.round(self.progress * (cards.length - 1));

          if (newIndex !== lastCardIndex) {
            animating = true;
            lastCardIndex = newIndex;

            const targetProgress = newIndex / (cards.length - 1);
            const targetScroll = self.start + (self.end - self.start) * targetProgress;

            if (window.lenis) {
              window.lenis.scrollTo(targetScroll, {
                duration: 0.6,
                easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
                onComplete: () => { animating = false; }
              });
            }
          }
        }
      });

      // Attach scroll blockers
      window.addEventListener('wheel', blockScroll, { passive: false });
      window.addEventListener('touchmove', blockScroll, { passive: false });

      const timer = setTimeout(() => ScrollTrigger.refresh(), 600);
      return () => clearTimeout(timer);
    }, wrapper);

    return () => {
      // Clean up event listeners on unmount
      ctx.revert();
    };
  }, []);

  return (
    <div className="card-stack-wrapper" ref={wrapperRef}>
      <div className="card-stack-sticky">
        <section className="card-stack-section" ref={sectionRef}>
          {/* Header */}
          <div className="card-stack-header">

            <h2 className="card-stack-title">
              Bắt đầu trong <em>3 bước đơn giản</em>
            </h2>
          </div>

          {/* Stacking Cards — each card is position:sticky so they pile up */}
          <div className="card-stack-container">
            {steps.map((step, index) => (
              <div
                className="card-stack-card"
                key={index}
                ref={(el) => (cardsRef.current[index] = el)}
                style={{
                  '--accent': step.accent,
                  '--card-index': index,
                }}
              >
                <div className="card-stack-card__inner">
                  {/* Trái: Số & Tiêu đề */}
                  <div className="card-stack-side card-stack-side--left">
                    <span className="card-stack-number" style={{ color: step.accent }}>
                      Bước {step.number}
                    </span>
                    <h3 className="card-stack-title-side">{step.title}</h3>
                  </div>

                  {/* Giữa: Tab nội dung */}
                  <div className="card-stack-tab" style={{ 
                    borderColor: `rgba(255,255,255,0.05)`, 
                    backgroundColor: step.video ? '#fff' : '#1C1C1C' 
                  }}>
                    {step.video ? (
                      <video 
                        src={step.video} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transform: 'scale(1.35)'
                        }}
                      />
                    ) : (
                      <div className="card-stack-tab-placeholder">
                        <div className="card-stack-icon" style={{ color: step.accent }}>
                          {step.icon}
                        </div>
                        <span className="card-stack-tab-hint" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                          Nội dung tab
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Phải: Mô tả */}
                  <div className="card-stack-side card-stack-side--right">
                    <p className="card-stack-desc-side">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CardStackSection;
