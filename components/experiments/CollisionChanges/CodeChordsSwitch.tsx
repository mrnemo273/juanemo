'use client';

import { useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import CollisionChanges from './CollisionChanges';
import PianoSplit from './PianoSplit';
import GravityWell from './GravityWell';

export default function CodeChordsSwitch() {
  const { activeSection } = useContext(ExperimentControlsContext);

  if (activeSection === 2) return <GravityWell />;
  if (activeSection === 1) return <PianoSplit />;
  return <CollisionChanges />;
}
