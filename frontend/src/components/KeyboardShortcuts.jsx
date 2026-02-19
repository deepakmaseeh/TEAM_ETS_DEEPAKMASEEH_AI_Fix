import React, { useEffect } from 'react';

export default function KeyboardShortcuts({ shortcuts }) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      const shortcut = shortcuts.find(s => 
        s.key === e.key && 
        s.ctrl === e.ctrlKey && 
        s.shift === e.shiftKey &&
        s.alt === e.altKey
      );

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);

  return null; // This component doesn't render anything
}
