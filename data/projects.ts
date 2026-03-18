export interface Project {
  name: string;
  description: string;
  url: string;
  publishedDate: string;
}

export const projects: Project[] = [
  {
    name: "State of Creative Jobs",
    description: "An interactive research tool that tracks demand, salary ranges, and AI automation risk across 20 creative job titles. Built to help designers, writers, and strategists understand where the industry is heading — and where the opportunities still are. Data is pulled from job boards, salary aggregators, and AI capability benchmarks, then visualized in a way that makes the trends immediately legible.",
    url: "https://state-of-creative-jobs.vercel.app",
    publishedDate: "March 5, 2025",
  },
  {
    name: "Juanemo",
    description: "A personal creative sandbox built entirely with Claude Code — no templates, no handoff, no compromise. The site uses Roboto Flex's 13 variable font axes as its primary design material, with generative per-character animation that makes the wordmark different on every load. Typography is the medium, and the site itself is the proof of concept.",
    url: "https://juanemo.vercel.app",
    publishedDate: "March 12, 2025",
  },
];
