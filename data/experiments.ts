export interface Experiment {
  slug: string;
  number: string;
  name: string;
  description: string;
  longDescription: string;
  publishedDate: string;
}

export const experiments: Experiment[] = [
  {
    slug: "generative-type",
    number: "01",
    name: "Generative Typography",
    description: "Per-character variable font drift — the wordmark is never the same twice.",
    longDescription:
      "Per-character variable font drift using Roboto Flex\u2019s 13 axes. Each letter independently randomizes weight, width, and optical size on a timed hold \u2192 shift cycle with spring easing.",
    publishedDate: "March 2025",
  },
];
