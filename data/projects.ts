export interface Project {
  name: string;
  description: string;
  url: string;
  publishedDate: string;
}

export const projects: Project[] = [
  {
    name: "State of Creative Jobs",
    description: "Research tool tracking demand, salary, and AI risk across 20 creative job titles.",
    url: "https://state-of-creative-jobs.vercel.app",
    publishedDate: "March 5, 2025",
  },
  {
    name: "Juanemo",
    description: "Personal creative site built entirely with Claude Code — typography as the medium.",
    url: "https://juanemo.vercel.app",
    publishedDate: "March 12, 2025",
  },
];
