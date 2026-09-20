import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.25, 1, 0.5, 1], // Smooth out-cubic transition
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.3,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

export default function PageWrapper({ children, className = "" }) {
  return (
    <div className={`
      flex-1 w-full 
      pt-20 md:pt-24 
      pb-16 md:pb-12 
      flex flex-col 
      min-h-screen
      ${className}
    `}>
      {children}
    </div>
  );
}
