import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  description?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  description, 
  position = 'right' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
  };

  return (
    <div 
      className="tooltip-container" 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {children}
      {isVisible && (
        <div 
          className="tooltip-content animate-fade-in"
          style={{
            position: 'absolute',
            zIndex: 1000,
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #334155',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            pointerEvents: 'none',
            ...positionStyles[position]
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: description ? '2px' : '0' }}>{content}</div>
          {description && <div style={{ opacity: 0.7, fontSize: '0.7rem', whiteSpace: 'normal', minWidth: '150px' }}>{description}</div>}
          
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            width: '0',
            height: '0',
            borderStyle: 'solid',
            ...(position === 'right' && {
              left: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '6px 6px 6px 0',
              borderColor: 'transparent #334155 transparent transparent',
            }),
            ...(position === 'left' && {
              right: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '6px 0 6px 6px',
              borderColor: 'transparent transparent transparent #334155',
            }),
            ...(position === 'top' && {
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '6px 6px 0 6px',
              borderColor: '#334155 transparent transparent transparent',
            }),
            ...(position === 'bottom' && {
              top: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '0 6px 6px 6px',
              borderColor: 'transparent transparent #334155 transparent',
            }),
          }} />
        </div>
      )}
    </div>
  );
};
