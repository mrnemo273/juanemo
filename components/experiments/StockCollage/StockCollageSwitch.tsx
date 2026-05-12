'use client';

import { useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import ExquisiteSearch from './ExquisiteSearch';

export default function StockCollageSwitch() {
  const { activeSection } = useContext(ExperimentControlsContext);

  // Sections B–D will plug in here as they ship.
  // Until then, fall through to Section A for any index.
  if (activeSection >= 0) return <ExquisiteSearch />;
  return <ExquisiteSearch />;
}
