'use client';

import React, { useState, useEffect } from 'react';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function Home() {
  const calculateTimeLeft = () => {
    const difference = +new Date('2025-06-12T07:00:00') - +new Date();
    let timeLeft: { [key: string]: number } = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timerComponents: React.ReactNode[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    timerComponents.push(
      <div key={interval} className="text-center p-2 md:p-4">
        <div className="text-4xl md:text-6xl font-bold">{timeLeft[interval] || 0}</div>
        <div className="text-base md:text-lg uppercase tracking-widest">{interval}</div>
      </div>
    );
  });

  return (
    <main
      className={`${poppins.className} flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-neutral-900 to-black text-white p-4 text-center`}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 1s ease-out;
        }
      `}</style>
      <h1 className="text-5xl md:text-7xl font-bold mb-5 fade-in">
        Youth Rally 2025
      </h1>
      <p className="text-lg md:text-2xl mb-8 md:mb-12 max-w-2xl leading-relaxed fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
        Get Ready! Pre-registration is dropping soon. Keep an eye on our socials for the official launch!
      </p>
      <div className="flex flex-wrap justify-center mt-5 fade-in" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
        {timerComponents.length ? timerComponents : <span className="text-2xl">Get Ready!</span>}
      </div>
    </main>
  );
}
