'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationContext } from '../lib/NavigationContext';
import { experiments } from '../data/experiments';
import DrawerNav from './DrawerNav';

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);

  // Derive active slug from pathname (e.g. /experiments/generative-type)
  const activeSlug = pathname.startsWith('/experiments/')
    ? pathname.split('/')[2] ?? ''
    : '';

  const handleSelectExperiment = useCallback(
    (slug: string) => {
      router.push(`/experiments/${slug}`);
    },
    [router],
  );

  return (
    <NavigationContext.Provider value={{ openDrawer, closeDrawer, isDrawerOpen }}>
      {children}
      <DrawerNav
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        experiments={experiments}
        activeSlug={activeSlug}
        onSelectExperiment={handleSelectExperiment}
      />
    </NavigationContext.Provider>
  );
}
