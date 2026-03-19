'use client';

import { createContext, useContext } from 'react';

interface NavigationContextValue {
  openIndex: () => void;
}

export const NavigationContext = createContext<NavigationContextValue>({
  openIndex: () => {},
});

export function useNavigation() {
  return useContext(NavigationContext);
}
