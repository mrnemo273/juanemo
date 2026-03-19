export interface Experiment {
  slug: string;
  name: string;
  description: string;
  publishedDate: string;
}

export const experiments: Experiment[] = [
  {
    slug: "generative-type",
    name: "Generative Typography",
    description: "Per-character variable font drift — the wordmark is never the same twice.",
    publishedDate: "March 2025",
  },
];
