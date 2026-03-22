'use client';

import { useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import CollisionChanges from './CollisionChanges';
import PianoSplit from './PianoSplit';
import GravityWell from './GravityWell';
import Flock from './Flock';
import Magnets from './Magnets';
import FreezeRelease from './FreezeRelease';
import Rain from './Rain';

export default function CodeChordsSwitch() {
  const { activeSection } = useContext(ExperimentControlsContext);

  if (activeSection === 6) return <Rain />;
  if (activeSection === 5) return <FreezeRelease />;
  if (activeSection === 4) return <Magnets />;
  if (activeSection === 3) return <Flock />;
  if (activeSection === 2) return <GravityWell />;
  if (activeSection === 1) return <PianoSplit />;
  return <CollisionChanges />;
}
