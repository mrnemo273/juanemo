'use client';

import { useState, useCallback } from 'react';
import { NavigationContext } from '../lib/NavigationContext';
import IndexOverlay from './IndexOverlay';

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => setIsOpen(false), []);
  const openIndex = useCallback(() => setIsOpen(true), []);

  return (
    <NavigationContext.Provider value={{ openIndex }}>
      {children}
      <IndexOverlay isOpen={isOpen} onClose={handleClose} />
    </NavigationContext.Provider>
  );
}
