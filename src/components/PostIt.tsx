import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export type PostItColor = 'yellow' | 'pink' | 'blue' | 'green';

interface PostItProps {
  key?: React.Key;
  text: string;
  color: PostItColor;
  onClick?: () => void;
  className?: string;
  rotation?: number;
}

const colorMap = {
  yellow: 'bg-gradient-to-br from-[#fff7b0] to-[#fde047] text-yellow-950 shadow-yellow-500/40',
  pink: 'bg-gradient-to-br from-[#fce7f3] to-[#f9a8d4] text-pink-950 shadow-pink-500/40',
  blue: 'bg-gradient-to-br from-[#dbeafe] to-[#93c5fd] text-blue-950 shadow-blue-500/40',
  green: 'bg-gradient-to-br from-[#dcfce7] to-[#86efac] text-green-950 shadow-green-500/40',
};

export function PostIt({ text, color, onClick, className, rotation = 0 }: PostItProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.08, zIndex: 20, rotate: rotation > 0 ? rotation + 2 : rotation - 2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ rotate: rotation }}
      onClick={onClick}
      className={cn(
        "relative w-48 h-48 sm:w-56 sm:h-56 p-5 sm:p-8 cursor-pointer shadow-xl transition-all flex flex-col justify-center items-center text-center rounded-sm",
        colorMap[color],
        className
      )}
      style={{
        borderBottomRightRadius: '24px',
      }}
    >
      {/* Tape effect */}
      <div 
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-7 bg-white/40 backdrop-blur-sm shadow-sm z-10" 
        style={{ 
          clipPath: 'polygon(4% 0, 96% 2%, 100% 100%, 0 98%)',
          transform: 'rotate(-2deg)'
        }} 
      />

      {/* Fold effect */}
      <div className="absolute bottom-0 right-0 w-10 h-10 bg-black/5" style={{
        clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
        borderTopLeftRadius: '24px'
      }} />
      
      <p className="font-hand text-2xl sm:text-3xl leading-tight line-clamp-5 drop-shadow-sm">
        {text}
      </p>
    </motion.div>
  );
}
