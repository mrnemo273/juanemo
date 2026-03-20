export interface SpecialProject {
  tag: string;
  name: string;
  description: string;
  color: string;
  url?: string;
}

export const specialProjects: SpecialProject[] = [
  {
    tag: 'Report',
    name: 'The State of Creative Jobs',
    description: 'Annual industry analysis of creative roles and hiring trends.',
    color: '#2D5A6B',
  },
  {
    tag: 'Case Study',
    name: 'Redesigning the Brief',
    description: 'How we rebuilt the creative brief process at scale.',
    color: '#8B4A3C',
  },
  {
    tag: 'Talk',
    name: 'Variable Fonts & The Future of Type',
    description: 'Conference talk on generative typography systems.',
    color: '#4A6741',
  },
  {
    tag: 'Tool',
    name: 'Axis Playground',
    description: 'Interactive variable font explorer for designers.',
    color: '#6B5A8C',
  },
];
