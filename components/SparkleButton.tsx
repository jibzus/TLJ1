import React from 'react';
import { Button } from "@/components/ui/button";

interface SparkleButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const SparkleButton: React.FC<SparkleButtonProps> = ({ onClick }) => (
  <Button onClick={onClick} className="p-0 bg-transparent hover:bg-transparent">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="24" height="24">
      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          .sparkle {
            fill: #FFD700;
          }
          .sparkle-1 {
            animation: twinkle 2s ease-in-out infinite;
          }
          .sparkle-2 {
            animation: twinkle 2s ease-in-out infinite 0.5s;
          }
          .sparkle-3 {
            animation: twinkle 2s ease-in-out infinite 1s;
          }
        `}
      </style>
      <path className="sparkle sparkle-1" d="M50 10 L60 45 L95 50 L60 55 L50 90 L40 55 L5 50 L40 45 Z" />
      <path className="sparkle sparkle-2" d="M80 15 L83 22 L90 25 L83 28 L80 35 L77 28 L70 25 L77 22 Z" />
      <path className="sparkle sparkle-3" d="M20 70 L23 77 L30 80 L23 83 L20 90 L17 83 L10 80 L17 77 Z" />
    </svg>
  </Button>
);

export default SparkleButton;