'use client';

import { createContext, useContext } from 'react';

interface NavigationContextValue {
  openDrawer: () => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
}

export const NavigationContext = createContext<NavigationContextValue>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isDrawerOpen: false,
});

export function useNavigation() {
  return useContext(NavigationContext);
}
