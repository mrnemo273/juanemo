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
    letter: '1',
    name: 'Collision Changes',
    hint: 'Move your cursor to attract the orbs',
    hintMobile: 'Tilt your phone to shift gravity',
    hintActionMobile: 'Enable Motion',
    description:
      'Glowing orbs float in space — each one a note in a jazz chord. Collisions sound both notes. The harmony cycles through a ii-V-I-IV progression every 8 bars.',
    instructions: [
      { icon: 'cursor', text: 'Move cursor to attract orbs' },
      { icon: 'click', text: 'Click to spawn a new orb' },
      { icon: 'eye', text: 'Watch for chord changes — orbs retune every 8 bars' },
    ],
    instructionsMobile: [
      { icon: 'move', text: 'Tilt phone to shift gravity' },
      { icon: 'click', text: 'Tap to spawn a new orb' },
      { icon: 'eye', text: 'Chord changes every 8 bars' },
    ],
    controls: ['speed'],
  },
];

export const experiments: Experiment[] = [
  {
    slug: 'code-chords',
    number: '02',
    name: 'Code Chords',
    description: 'Jazz harmony through particle physics',
    longDescription:
      'Glowing orbs float in zero gravity — each one a note in a jazz chord. When they collide, both notes ring out. The chord changes cycle through a classic ii-V-I-IV progression. Tilt your phone to shift gravity and conduct the collisions.',
    publishedDate: 'March 2026',
    sections: ['Collision Changes'],
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
