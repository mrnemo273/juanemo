export interface SectionConfig {
  letter: string;
  name: string;
  hint: string;
  hintAction?: string;
  hintMobile?: string;
  hintActionMobile?: string;
  description: string;
  instructions: {
    icon: string;
    text: string;
  }[];
  instructionsMobile?: {
    icon: string;
    text: string;
  }[];
  controls: string[];
}

export interface Experiment {
  slug: string;
  number: string;
  name: string;
  description: string;
  longDescription: string;
  publishedDate: string;
  sections?: string[];
  sectionConfigs?: SectionConfig[];
}

export const sectionConfigs: SectionConfig[] = [
  {
    letter: 'A',
    name: 'Generative Drift',
    hint: 'Watch the letters shift',
    description:
      'Each letter of JUANEMO independently randomizes its weight, width, and optical size on a timed hold \u2192 shift cycle. The result is a wordmark that never looks the same twice \u2014 a living identity that drifts through the variable font\u2019s 13-axis design space.',
    instructions: [
      { icon: 'eye', text: '<strong>Watch</strong> \u2014 the letters shift automatically on a timed cycle.' },
      { icon: 'refresh', text: '<strong>Shuffle</strong> \u2014 re-randomize all letters instantly.' },
      { icon: 'clock', text: '<strong>Speed</strong> \u2014 change how long letters hold before shifting.' },
    ],
    controls: ['speed', 'easing', 'shuffle'],
  },
  {
    letter: 'B',
    name: 'Proximity + Drift',
    hint: 'Move your cursor near the letters',
    hintMobile: 'Tilt your phone near the letters',
    hintActionMobile: 'Enable Motion',
    description:
      'Ambient drift runs in the background, but letters near your cursor get pulled toward bold and extended. Move away and they relax back. The interaction radius is 250px.',
    instructions: [
      { icon: 'cursor', text: '<strong>Hover near</strong> \u2014 letters get bolder and wider as your cursor approaches.' },
      { icon: 'move', text: '<strong>Pull away</strong> \u2014 letters relax back into the ambient drift.' },
    ],
    instructionsMobile: [
      { icon: 'move', text: '<strong>Tilt your phone</strong> \u2014 letters near the tilt point get bolder and wider.' },
      { icon: 'refresh', text: '<strong>Level the phone</strong> \u2014 letters relax back into the ambient drift.' },
      { icon: 'cursor', text: 'Or <strong>drag your finger</strong> near the letters for direct control.' },
    ],
    controls: ['speed', 'easing'],
  },
  {
    letter: 'C',
    name: 'Mouse-Responsive Axes',
    hint: 'Move your cursor across the viewport',
    hintMobile: 'Tilt to reshape the letters',
    hintActionMobile: 'Enable Motion',
    description:
      "Cursor position maps directly to the font's variable axes. Horizontal = width, vertical = weight. The entire wordmark follows your hand.",
    instructions: [
      { icon: 'move', text: '<strong>Move horizontally</strong> \u2014 controls letter width. Left = condensed, right = extended.' },
      { icon: 'move-v', text: '<strong>Move vertically</strong> \u2014 controls letter weight. Top = light, bottom = bold.' },
    ],
    instructionsMobile: [
      { icon: 'move', text: '<strong>Tilt left/right</strong> \u2014 controls letter width. Left = condensed, right = extended.' },
      { icon: 'move-v', text: '<strong>Tilt forward/back</strong> \u2014 controls letter weight. Forward = light, back = bold.' },
      { icon: 'cursor', text: 'Or <strong>drag your finger</strong> to control directly.' },
    ],
    controls: [],
  },
  {
    letter: 'D',
    name: 'Per-Character Hover',
    hint: 'Hover over individual letters',
    hintMobile: 'Drag across the letters',
    description:
      'Pure CSS \u2014 no JavaScript animation. Hovering a letter collapses its axes to minimum values and lifts it up. Sweep across the word to create a wave.',
    instructions: [
      { icon: 'cursor', text: '<strong>Hover a letter</strong> \u2014 it collapses to its narrowest, lightest form and lifts.' },
      { icon: 'move', text: '<strong>Sweep across</strong> \u2014 move quickly across the word for a wave effect.' },
    ],
    instructionsMobile: [
      { icon: 'cursor', text: '<strong>Drag across</strong> the word \u2014 letters collapse and lift as your finger passes.' },
      { icon: 'move', text: '<strong>Lift your finger</strong> \u2014 letters spring back to their natural form.' },
      { icon: 'play', text: '<strong>Drag faster</strong> for a sharper wave, slower for a gentle ripple.' },
    ],
    controls: [],
  },
  {
    letter: 'E',
    name: 'Expand Entrance',
    hint: 'Plays on load',
    hintAction: 'Replay',
    description:
      'CSS keyframe animation \u2014 letters start ultra-condensed and expand to full width with staggered delay. A theatrical reveal, like curtains opening.',
    instructions: [
      { icon: 'eye', text: '<strong>Watch</strong> \u2014 the animation plays automatically on load.' },
      { icon: 'refresh', text: '<strong>Replay</strong> \u2014 tap Replay next to the section name to trigger the entrance again.' },
    ],
    controls: [],
  },
  {
    letter: 'F',
    name: 'Axis Breathing',
    hint: 'Watch the rhythm',
    description:
      'All letters animate in unison on a slow inhale/exhale cycle \u2014 weight, width, and letter-spacing oscillate together. The wordmark breathes.',
    instructions: [
      { icon: 'eye', text: '<strong>Observe</strong> \u2014 the wordmark breathes continuously. No interaction needed.' },
      { icon: 'clock', text: '<strong>Speed</strong> \u2014 controls the breathing tempo. Slow = hypnotic; fast = anxious.' },
    ],
    controls: ['speed'],
  },
];

export const codeChordsSectionConfigs: SectionConfig[] = [
  {
    letter: 'A',
    name: 'Collision Changes',
    hint: '',
    hintMobile: '',
    hintActionMobile: '',
    description:
      'Glowing orbs float in space — each one a note in a jazz chord. When they collide, both notes ring out. Choose a chord from the dropdown and watch the orbs retune.',
    instructions: [],
    instructionsMobile: [],
    controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
  },
  {
    letter: 'B',
    name: 'Piano Split',
    hint: '',
    hintMobile: '',
    hintActionMobile: '',
    description:
      'The canvas splits into bass and treble clef — left hand and right hand of a jazz piano. Each side collides independently, but they share the same chord changes and metronome. Bass anchors the harmony with roots and fifths; treble adds color with thirds, sevenths, and ninths.',
    instructions: [
      { icon: 'cursor', text: '<strong>Hover either side</strong> — attract orbs on that half only' },
      { icon: 'eye', text: '<strong>Listen for stereo</strong> — bass pans left, treble pans right' },
    ],
    instructionsMobile: [
      { icon: 'move', text: '<strong>Tilt</strong> — shifts gravity for both halves' },
      { icon: 'cursor', text: '<strong>Touch a side</strong> — attract orbs on that half' },
      { icon: 'eye', text: 'Bass below, treble above — like piano keys' },
    ],
    controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
  },
  {
    letter: 'C',
    name: 'Gravity Well',
    hint: '',
    hintMobile: '',
    hintActionMobile: '',
    description:
      'Orbs orbit a central mass — inner orbits carry chord tones, outer orbits carry extensions. Inner orbits are faster, so crossing points create rhythmic collisions. Drag an orb to slingshot it to a new orbit.',
    instructions: [
      { icon: 'cursor', text: '<strong>Drag an orb</strong> to slingshot it to a new orbit radius' },
      { icon: 'eye', text: '<strong>Inner orbits</strong> are faster — chord tones orbit close to the center' },
      { icon: 'refresh', text: '<strong>Pick a chord</strong> — orbs retune and spiral to new orbits' },
    ],
    instructionsMobile: [
      { icon: 'move', text: '<strong>Tilt</strong> to offset the orbit center (creates elliptical paths)' },
      { icon: 'cursor', text: '<strong>Touch</strong> to gently attract nearby orbs' },
      { icon: 'eye', text: 'Chord tones orbit close, extensions orbit far' },
    ],
    controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
  },
  {
    letter: 'D',
    name: 'Flock',
    hint: '',
    hintMobile: '',
    hintActionMobile: '',
    description:
      'Seven orbs follow boids flocking rules — separation, alignment, cohesion. Your cursor leads the swarm. Tight clusters create dense collisions and rich chords; scattered orbs play sparse isolated notes.',
    instructions: [
      { icon: 'cursor', text: '<strong>Move your cursor</strong> to lead the flock' },
      { icon: 'eye', text: '<strong>Watch clustering</strong> — tight flocks collide more, playing dense chords' },
      { icon: 'refresh', text: '<strong>Pick a chord</strong> — orbs retune in place, flock keeps its shape' },
    ],
    instructionsMobile: [
      { icon: 'move', text: '<strong>Tilt</strong> to steer the flock direction' },
      { icon: 'cursor', text: '<strong>Touch</strong> to attract the swarm to your finger' },
      { icon: 'eye', text: 'Orbs wrap around edges — watch them reappear on the opposite side' },
    ],
    controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
  },
  {
    letter: 'E',
    name: 'Magnets',
    hint: '',
    hintMobile: '',
    hintActionMobile: '',
    description:
      'Orbs attract or repel based on the musical interval between their notes. Consonant intervals pull together, dissonant intervals push apart. Change the chord and watch every relationship reshuffle.',
    instructions: [
      { icon: 'cursor', text: '<strong>Drag an orb</strong> to override magnetic forces — release to let physics resume' },
      { icon: 'eye', text: '<strong>Solid lines</strong> = consonant attraction, <strong>dashed lines</strong> = dissonant repulsion' },
      { icon: 'refresh', text: '<strong>Pick a chord</strong> — all intervals change, orbs reorganize' },
    ],
    instructionsMobile: [
      { icon: 'cursor', text: '<strong>Tap an orb</strong> to pin it in place — tap again to unpin' },
      { icon: 'move', text: '<strong>Tilt</strong> to add gentle directional bias' },
      { icon: 'eye', text: 'Watch consonant pairs cluster and dissonant pairs drift apart' },
    ],
    controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
  },
  {
    letter: 'F',
    name: 'Freeze & Release',
    hint: '',
    hintMobile: '',
    hintActionMobile: '',
    description:
      'Silence is music too. Freeze all motion — orbs hang in space, no sound. Release and they burst outward. The longer the silence, the bigger the burst.',
    instructions: [
      { icon: 'click', text: '<strong>Press & hold</strong> anywhere or <strong>Space</strong> to freeze — release to burst' },
      { icon: 'eye', text: '<strong>Longer freeze</strong> = more dramatic release burst' },
      { icon: 'refresh', text: '<strong>Change chords</strong> while frozen — the harmony shifts under the silence' },
    ],
    instructionsMobile: [
      { icon: 'click', text: '<strong>Press & hold</strong> to freeze — lift to release burst' },
      { icon: 'move', text: '<strong>Tilt while frozen</strong> to aim the burst direction' },
      { icon: 'clock', text: 'Hold longer for a bigger burst — auto-releases when full' },
    ],
    controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
  },
  {
    letter: 'G',
    name: 'Rain',
    hint: '',
    hintMobile: '',
    hintActionMobile: '',
    description:
      'Notes fall like rain. Each drop sounds on landing. Control the density — drizzle for a ballad, downpour for uptempo. Chord changes color the falling waves.',
    instructions: [
      { icon: 'move-v', text: '<strong>Mouse Y</strong> controls rain density (top = drizzle, bottom = downpour)' },
      { icon: 'cursor', text: '<strong>Mouse X</strong> adds subtle wind direction' },
      { icon: 'refresh', text: '<strong>Chord changes</strong> color new drops — watch the wave shift down' },
    ],
    instructionsMobile: [
      { icon: 'move', text: '<strong>Tilt forward</strong> for heavy rain, level for drizzle' },
      { icon: 'move', text: '<strong>Tilt sideways</strong> for wind direction' },
      { icon: 'click', text: '<strong>Tap</strong> for a burst of drops' },
    ],
    controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
  },
];

export const giantStepsSectionConfigs: SectionConfig[] = [
  {
    letter: 'A',
    name: 'Coltrane Circle',
    hint: '',
    hintMobile: '',
    hintActionMobile: '',
    description:
      'The circle of fifths rendered as 12 key points. Seven orbs orbit the active key center. When a Coltrane Change fires, orbs slingshot across the diameter to the new center. An equilateral triangle connecting B, G, and E♭ pulses on each key change.',
    instructions: [
      { icon: 'move-v', text: '<strong>Mouse Y</strong> controls tempo (top = 80 BPM, bottom = 320 BPM)' },
      { icon: 'cursor', text: '<strong>Cursor</strong> gently pulls the nearest orb' },
      { icon: 'click', text: '<strong>Click/tap</strong> to spawn a burst of 3 extra orbs' },
    ],
    instructionsMobile: [
      { icon: 'move', text: '<strong>Tilt forward/back</strong> controls tempo (flat = slow, tilted = fast)' },
      { icon: 'move', text: '<strong>Tilt sideways</strong> adds wind to all orbs' },
      { icon: 'click', text: '<strong>Tap</strong> to spawn a burst of 3 extra orbs' },
    ],
    controls: ['tempo', 'decay', 'reverb'],
  },
];

export const experiments: Experiment[] = [
  {
    slug: 'giant-steps',
    number: '03',
    name: 'Giant Steps',
    description: 'Coltrane Changes on the circle of fifths',
    longDescription:
      'Inspired by John Coltrane\'s Giant Steps (1959). The Coltrane substitution divides the octave into three equal parts — key centers B, G, and E♭. Seven orbs orbit the active key center and slingshot across when the harmony shifts. Mouse Y controls tempo from 80 to 320 BPM.',
    publishedDate: 'March 2026',
    sections: ['Coltrane Circle', 'Three-Body Problem', 'Chromatic Bridges', 'Mirror Symmetry'],
    sectionConfigs: giantStepsSectionConfigs,
  },
  {
    slug: 'code-chords',
    number: '02',
    name: 'Code Chords',
    description: 'Jazz harmony through particle physics',
    longDescription:
      'Glowing orbs float in zero gravity — each one a note in a jazz chord. When they collide, both notes ring out. The chord changes cycle through a classic ii-V-I-IV progression. Tilt your phone to shift gravity and conduct the collisions.',
    publishedDate: 'March 2026',
    sections: ['Collision Changes', 'Piano Split', 'Gravity Well', 'Flock', 'Magnets', 'Freeze & Release', 'Rain'],
    sectionConfigs: codeChordsSectionConfigs,
  },
  {
    slug: 'generative-type',
    number: '01',
    name: 'Generative Typography',
    description: 'Per-character variable font drift \u2014 the wordmark is never the same twice.',
    longDescription:
      'Per-character variable font drift using Roboto Flex\u2019s 13 axes. Each letter independently randomizes weight, width, and optical size on a timed hold \u2192 shift cycle with spring easing.',
    publishedDate: 'March 2025',
    sections: [
      'Generative Drift',
      'Proximity + Drift',
      'Mouse-Responsive Axes',
      'Per-Character Hover',
      'Expand Entrance',
      'Axis Breathing',
    ],
    sectionConfigs,
  },
];
