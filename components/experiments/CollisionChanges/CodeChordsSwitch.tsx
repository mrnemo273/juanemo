'use client';

import { useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import CollisionChanges from './CollisionChanges';
import PianoSplit from './PianoSplit';

export default function CodeChordsSwitch() {
  const { activeSection } = useContext(ExperimentControlsContext);

  if (activeSection === 1) return <PianoSplit />;
  return <CollisionChanges />;
}
