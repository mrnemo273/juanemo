export interface Mood {
  GRAD: number;
  XTRA: number;
  XOPQ: number;
  YOPQ: number;
  YTUC: number;
  slnt: number;
  opsz: number;
}

export type MoodName = 'SHARP' | 'AIRY' | 'HEAVY' | 'REFINED' | 'PUNCHY';

export const moods: Record<MoodName, Mood> = {
  SHARP:   { GRAD: 120,  XTRA: 340, XOPQ: 160, YOPQ: 30,  YTUC: 740, slnt: 0,  opsz: 144 },
  AIRY:    { GRAD: -100, XTRA: 580, XOPQ: 40,  YOPQ: 100, YTUC: 528, slnt: 0,  opsz: 80  },
  HEAVY:   { GRAD: 150,  XTRA: 400, XOPQ: 175, YOPQ: 25,  YTUC: 760, slnt: 0,  opsz: 144 },
  REFINED: { GRAD: 0,    XTRA: 468, XOPQ: 88,  YOPQ: 79,  YTUC: 620, slnt: -2, opsz: 100 },
  PUNCHY:  { GRAD: 100,  XTRA: 500, XOPQ: 130, YOPQ: 50,  YTUC: 760, slnt: 0,  opsz: 120 },
};

export const moodNames: MoodName[] = ['SHARP', 'AIRY', 'HEAVY', 'REFINED', 'PUNCHY'];

export function getRandomMood(): { name: MoodName; values: Mood } {
  const name = moodNames[Math.floor(Math.random() * moodNames.length)];
  return { name, values: moods[name] };
}
