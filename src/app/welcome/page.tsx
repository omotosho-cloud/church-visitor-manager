'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { Users, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function WelcomePage() {
  const router = useRouter();
  const [churchName, setChurchName] = useState('Welcome');
  const [logo, setLogo] = useState<string | null>(null);

  
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/church-info')
      .then((res) => res.json())
      .then((data) => {
        setChurchName(data.church_name || 'Welcome');
        setLogo(data.logo);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current, 
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );

      gsap.fromTo(subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: 'power3.out' }
      );

      gsap.fromTo(buttonsRef.current?.children || [],
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, stagger: 0.2, delay: 0.6, ease: 'back.out(1.7)' }
      );

      if (heroRef.current) {
        gsap.to(heroRef.current, {
          y: -10,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const handleSelection = (type: 'visitor' | 'member') => {
    gsap.to([titleRef.current, subtitleRef.current, buttonsRef.current], {
      opacity: 0,
      scale: 0.9,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        router.push(type === 'visitor' ? '/visitor-form' : '/member-form');
      },
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-indigo-900 via-purple-900 to-blue-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMjBjMC0yIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTEyIDM0YzAtMiAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDIwYzAtMiAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center">
          {/* Logo */}
          {logo && (
            <div ref={heroRef} className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative p-6 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                  <img src={logo} alt="Church Logo" className="h-24 w-24 object-contain" />
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <h1
            ref={titleRef}
            className="text-6xl md:text-7xl font-bold mb-6 text-white"
          >
            {churchName}
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto"
          >
            Welcome! We&apos;re excited to connect with you. Please let us know who you are.
          </p>

          {/* Selection Buttons */}
          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* Visitor Button */}
            <button
              onClick={() => handleSelection('visitor')}
              className="group relative w-full sm:w-80 h-64 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative h-full flex flex-col items-center justify-center p-8">
                <div className="mb-6 p-4 bg-blue-500/20 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-16 h-16 text-blue-300" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">I&apos;m a Visitor</h3>
                <p className="text-white/70 text-sm">First time here? We&apos;d love to get to know you!</p>
                <div className="mt-6 flex items-center gap-2 text-blue-300 group-hover:gap-4 transition-all duration-300">
                  <span className="text-sm font-semibold">Continue</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Member Button */}
            <button
              onClick={() => handleSelection('member')}
              className="group relative w-full sm:w-80 h-64 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative h-full flex flex-col items-center justify-center p-8">
                <div className="mb-6 p-4 bg-purple-500/20 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-16 h-16 text-purple-300" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">I&apos;m a Member</h3>
                <p className="text-white/70 text-sm">Already part of our family? Update your info here.</p>
                <div className="mt-6 flex items-center gap-2 text-purple-300 group-hover:gap-4 transition-all duration-300">
                  <span className="text-sm font-semibold">Continue</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      `}</style>
    </div>
  );
}
