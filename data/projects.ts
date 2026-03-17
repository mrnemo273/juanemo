export interface Project {
  name: string;
  description: string;
  url: string;
  year: number;
  tags: string[];
}

export const projects: Project[] = [
  {
    name: "State of Creative Jobs",
    description: "Research tool tracking demand, salary, and AI risk across 20 creative job titles.",
    url: "https://state-of-creative-jobs.vercel.app",
    year: 2025,
    tags: ["Next.js", "TypeScript", "Claude Code"],
  },
];
