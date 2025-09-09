"use client";

import { useState, useEffect } from "react";
import styles from "@/app/components/styles/TempleLoader.module.css";

interface TempleLoaderProps {
  onLoadingComplete?: () => void;
}

const TempleLoader = ({ onLoadingComplete }: TempleLoaderProps) => {
  const [loadingText, setLoadingText] = useState(
    "Connecting to Sacred Blockchain..."
  );
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      left: number;
      size: number;
      duration: number;
      delay: number;
    }>
  >([]);

  const loadingTexts = [
    "Connecting to Sacred Blockchain...",
    "Verifying Temple Credentials...",
    "Loading Donation Records...",
    "Initializing Smart Contracts...",
    "Securing Fund Management...",
    "Ready to Serve Devotees...",
  ];

  useEffect(() => {
    // Update loading text
    const textInterval = setInterval(() => {
      setLoadingText((prev) => {
        const currentIndex = loadingTexts.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingTexts.length;
        return loadingTexts[nextIndex];
      });
    }, 2000);

    // Generate particles
    const particleInterval = setInterval(() => {
      const newParticle = {
        id: Math.random(),
        left: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 3 + 4,
        delay: Math.random() * 2,
      };

      setParticles((prev) => [...prev, newParticle]);

      // Remove particle after animation
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 8000);
    }, 300);

    // Simulate loading completion (remove in production)
    const loadingTimeout = setTimeout(() => {
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, 12000);

    return () => {
      clearInterval(textInterval);
      clearInterval(particleInterval);
      clearTimeout(loadingTimeout);
    };
  }, [onLoadingComplete]);

  return (
    <div className={styles.container}>
      <div className={styles.floatingParticles}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={styles.particle}
            style={{
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
      </div>

      <div className={styles.loaderContainer}>
        <div className={styles.templeIcon}>
          <div className={styles.blockchainRing}></div>
          <div className={styles.blockchainDots}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
          <TempleIcon />
        </div>

        <h1 className={styles.title}>Temple Fund</h1>
        <p className={styles.subtitle}>Decentralized Blockchain Management</p>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}></div>
        </div>

        <p className={styles.loadingText}>{loadingText}</p>

        <div className={styles.featureIcons}>
          <div className={styles.featureIcon}>
            <TransparentIcon />
            <span className={styles.featureText}>Transparent</span>
          </div>
          <div className={styles.featureIcon}>
            <SecureIcon />
            <span className={styles.featureText}>Secure</span>
          </div>
          <div className={styles.featureIcon}>
            <DonationIcon />
            <span className={styles.featureText}>Donations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// SVG Components
const TempleIcon = () => (
  <svg
    className={styles.templeSvg}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M50 5L85 25V35H15V25L50 5Z"
      fill="#ff6b35"
      stroke="#f7931e"
      strokeWidth="2"
    />
    <rect
      x="20"
      y="35"
      width="60"
      height="40"
      fill="#ff6b35"
      stroke="#f7931e"
      strokeWidth="2"
    />
    <rect x="25" y="40" width="8" height="30" fill="#fff" />
    <rect x="35" y="40" width="8" height="30" fill="#fff" />
    <rect x="45" y="40" width="8" height="30" fill="#fff" />
    <rect x="55" y="40" width="8" height="30" fill="#fff" />
    <rect x="65" y="40" width="8" height="30" fill="#fff" />
    <rect
      x="10"
      y="75"
      width="80"
      height="8"
      fill="#ff6b35"
      stroke="#f7931e"
      strokeWidth="2"
    />
    <circle cx="50" cy="20" r="3" fill="#ffcc02" />
    <path d="M40 50h20v15h-20z" fill="#f7931e" />
    <circle cx="48" cy="57" r="1" fill="#fff" />
  </svg>
);

const TransparentIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
  </svg>
);

const SecureIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" />
  </svg>
);

const DonationIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5H5.21L4.27,2H1M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z" />
  </svg>
);

export default TempleLoader;
