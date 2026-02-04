import React from 'react';
import logo from '@/assets/img/logoinc.png';

interface LogoProps {
  className?: string;
  imgClassName?: string;
}

export default function Logo({ className = "h-11 w-11 sm:h-12 sm:w-12", imgClassName = "" }: LogoProps) {
  return (
    <div className={`group flex items-center justify-center relative ${className}`}>
      {/* Glow Effect */}
      <div className="absolute -inset-2 rounded-2xl bg-primary/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Container */}
      <div className="relative h-full w-full rounded-2xl bg-surface border border-border flex items-center justify-center overflow-hidden">
        <img
          src={logo}
          alt="Only Program"
          className={`h-full w-full object-contain opacity-95 group-hover:opacity-100 transition-opacity ${imgClassName}`}
          draggable={false}
        />
      </div>
    </div>
  );
}
