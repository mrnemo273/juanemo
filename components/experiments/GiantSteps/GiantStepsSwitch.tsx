'use client';

import { useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import GiantSteps from './GiantSteps';
import ThreeBody from './ThreeBody';
// Future sections:
// import ChromaticBridges from './ChromaticBridges';
// import MirrorSymmetry from './MirrorSymmetry';

export default function GiantStepsSwitch() {
  const { activeSection } = useContext(ExperimentControlsContext);

  // if (activeSection === 3) return <MirrorSymmetry />;
  // if (activeSection === 2) return <ChromaticBridges />;
  if (activeSection === 1) return <ThreeBody />;
  return <GiantSteps />;
}
