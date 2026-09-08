import React, { useRef, useState, ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  maxTilt = 8,
  scale = 1.02,
  style = {},
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    setMousePos({ x: percentX, y: percentY });

    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -maxTilt;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <div
        className="tilt-card-inner"
        style={{
          transform,
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
        }}
      >
        {children}
        <div
          className="tilt-card-shine"
          style={
            {
              '--mouse-x': `${mousePos.x}%`,
              '--mouse-y': `${mousePos.y}%`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
};
