'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LumiMascotProps {
  size?: 'sm' | 'md' | 'lg';
  trackMouse?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 36,
  md: 54,
  lg: 64,
};

export function LumiMascot({
  size = 'md',
  trackMouse = true,
  className,
}: LumiMascotProps) {
  const uid = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isBlinking, setIsBlinking] = useState(false);

  const rawEyeX = useMotionValue(0);
  const rawEyeY = useMotionValue(0);
  const rawBodyX = useMotionValue(0);
  const rawBodyY = useMotionValue(0);
  const rawTilt = useMotionValue(0);

  const eyeX = useSpring(rawEyeX, { stiffness: 260, damping: 22, mass: 0.5 });
  const eyeY = useSpring(rawEyeY, { stiffness: 260, damping: 22, mass: 0.5 });
  const bodyX = useSpring(rawBodyX, { stiffness: 150, damping: 20, mass: 0.8 });
  const bodyY = useSpring(rawBodyY, { stiffness: 150, damping: 20, mass: 0.8 });
  const bodyTilt = useSpring(rawTilt, { stiffness: 140, damping: 18, mass: 0.7 });

  useEffect(() => {
    if (!trackMouse || prefersReducedMotion) return;

    const handleMouseMove = (event: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const strength = Math.min(dist / 360, 1);

      const nx = (dx / dist) * strength;
      const ny = (dy / dist) * strength;

      rawEyeX.set(nx * 3.4);
      rawEyeY.set(ny * 2.4);
      rawBodyX.set(nx * 2.4);
      rawBodyY.set(ny * 1.8);
      rawTilt.set(nx * 6.5);
    };

    const handleMouseLeave = () => {
      rawEyeX.set(0);
      rawEyeY.set(0);
      rawBodyX.set(0);
      rawBodyY.set(0);
      rawTilt.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [trackMouse, prefersReducedMotion, rawEyeX, rawEyeY, rawBodyX, rawBodyY, rawTilt]);

  useEffect(() => {
    if (!trackMouse || prefersReducedMotion) return;

    let timeoutId: number;
    const scheduleBlink = () => {
      const delay = 3400 + Math.random() * 2800;
      timeoutId = window.setTimeout(() => {
        setIsBlinking(true);
        window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 145);
      }, delay);
    };

    scheduleBlink();
    return () => window.clearTimeout(timeoutId);
  }, [trackMouse, prefersReducedMotion]);

  const px = SIZE_MAP[size];

  return (
    <div
      ref={containerRef}
      style={{ width: px, height: px }}
      className={cn('relative inline-flex items-center justify-center select-none', className)}
    >
      {/* Soft ambient aura glow */}
      {size !== 'sm' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2 rounded-full opacity-55 dark:opacity-75 blur-md"
          style={{
            background:
              'radial-gradient(circle, rgba(124,92,252,0.45) 0%, rgba(212,175,55,0.22) 55%, transparent 74%)',
          }}
        />
      )}

      <motion.svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={
          trackMouse && !prefersReducedMotion
            ? { x: bodyX, y: bodyY, rotate: bodyTilt }
            : undefined
        }
        animate={
          trackMouse && !prefersReducedMotion
            ? { y: [0, -2.5, 0] }
            : undefined
        }
        transition={
          trackMouse && !prefersReducedMotion
            ? { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
        className="relative z-10 overflow-visible"
      >
        <defs>
          <radialGradient id={`lumiBody-${uid}`} cx="34%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#DDD6FE" />
            <stop offset="32%" stopColor="#8B6BFF" />
            <stop offset="78%" stopColor="#6D4AF7" />
            <stop offset="100%" stopColor="#4B2CC2" />
          </radialGradient>
          <linearGradient id={`lumiGold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <linearGradient id={`lumiVisor-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E243C" />
            <stop offset="100%" stopColor="#0D1222" />
          </linearGradient>
          <filter id={`eyeGlow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Golden Antennae Ears */}
        <path
          d="M25.5 14.5C24.4 10.6 25.2 8.2 26.8 8.2C28.3 8.2 29.1 10.5 28.6 14"
          fill={`url(#lumiGold-${uid})`}
        />
        <path
          d="M38.5 14.5C39.6 10.6 38.8 8.2 37.2 8.2C35.7 8.2 34.9 10.5 35.4 14"
          fill={`url(#lumiGold-${uid})`}
        />

        {/* Floating golden spark orb on the right */}
        <motion.circle
          cx="56.5"
          cy="34"
          r="2.9"
          fill={`url(#lumiGold-${uid})`}
          animate={
            trackMouse && !prefersReducedMotion
              ? { y: [0, -2.5, 0], opacity: [0.85, 1, 0.85] }
              : undefined
          }
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Main Spherical Body */}
        <circle
          cx="32"
          cy="34"
          r="21"
          fill={`url(#lumiBody-${uid})`}
        />

        {/* Subtle glossy rim highlight */}
        <ellipse
          cx="25"
          cy="21"
          rx="8"
          ry="4.2"
          transform="rotate(-18 25 21)"
          fill="#FFFFFF"
          fillOpacity="0.34"
        />

        {/* Dark Visor Face */}
        <motion.g
          style={
            trackMouse && !prefersReducedMotion
              ? { x: eyeX, y: eyeY }
              : undefined
          }
        >
          <rect
            x="17.5"
            y="25.5"
            width="29"
            height="17"
            rx="8.5"
            fill={`url(#lumiVisor-${uid})`}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="0.9"
          />

          {/* Expressive Glowing Golden Eyes */}
          <motion.g
            filter={`url(#eyeGlow-${uid})`}
            animate={{ scaleY: isBlinking ? 0.14 : 1 }}
            transition={{ duration: 0.09 }}
            style={{ transformOrigin: '32px 34px' }}
          >
            <rect
              x="24.2"
              y="30.2"
              width="4.4"
              height="7.6"
              rx="2.2"
              fill="#FDE047"
            />
            <rect
              x="35.4"
              y="30.2"
              width="4.4"
              height="7.6"
              rx="2.2"
              fill="#FDE047"
            />
          </motion.g>
        </motion.g>
      </motion.svg>
    </div>
  );
}
