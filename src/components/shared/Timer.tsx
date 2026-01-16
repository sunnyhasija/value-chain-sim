'use client';

import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  startTime: number;
  duration: number; // seconds
  onExpire?: () => void;
  className?: string;
}

export function Timer({ startTime, duration, onExpire, className = '' }: TimerProps) {
  const [remaining, setRemaining] = useState(0);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);

      if (left === 0 && onExpire && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration, onExpire]);

  useEffect(() => {
    hasExpiredRef.current = false;
  }, [startTime, duration]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const isLow = remaining < 60;
  const isCritical = remaining < 30;

  return (
    <div
      className={`font-mono text-lg ${
        isCritical
          ? 'text-red-600 animate-pulse'
          : isLow
          ? 'text-yellow-600'
          : 'text-gray-700'
      } ${className}`}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}

interface CountdownDisplayProps {
  startTime: number;
  duration: number;
  label?: string;
  onExpire?: () => void;
}

export function CountdownDisplay({
  startTime,
  duration,
  label = 'Time Remaining',
  onExpire,
}: CountdownDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{label}:</span>
      <Timer startTime={startTime} duration={duration} onExpire={onExpire} />
    </div>
  );
}
