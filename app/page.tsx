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
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <span key={interval} style={{ padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '60px', fontWeight: 'bold' }}>{timeLeft[interval]}</div>
        <div style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '2px' }}>{interval}</div>
      </span>
    );
  });

  return (
    <main
      className={poppins.className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(45deg, #1a1a1a, #000000)',
        color: '#ffffff',
        fontFamily: poppins.style.fontFamily,
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        h1 {
          animation: fadeIn 1s ease-out;
        }
      `}</style>
      <h1 style={{ fontSize: '72px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
        Youth Rally 2025
      </h1>
      <p style={{ fontSize: '22px', textAlign: 'center', marginBottom: '50px', maxWidth: '600px', lineHeight: '1.6' }}>
        We are working in progress with the Pre-registration. Stay tuned for our social media updates.
      </p>
      <div style={{ display: 'flex', marginTop: '20px' }}>
        {timerComponents.length ? timerComponents : <span>Get Ready!</span>}
      </div>
    </main>
  );
}
