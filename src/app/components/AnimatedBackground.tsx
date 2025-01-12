// components/AnimatedBackground.tsx
"use client";
import { motion } from "framer-motion";

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />

      {/* Animated circles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 70%)`,
            width: Math.random() * 400 + 100,
            height: Math.random() * 400 + 100,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            scale: [1, Math.random() * 0.3 + 0.8],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px),
                           linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
    </div>
  );
};