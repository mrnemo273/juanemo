import { experiments } from '@/data/experiments';
import ExperimentShell from '@/components/ExperimentShell';
import GenerativeType from '@/components/experiments/GenerativeType';
import { notFound } from 'next/navigation';

// Map slugs to experiment components
const experimentComponents: Record<string, React.ComponentType> = {
  'generative-type': GenerativeType,
};

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const experiment = experiments.find(e => e.slug === slug);
  if (!experiment) notFound();

  const Component = experimentComponents[slug];
  if (!Component) notFound();

  return (
    <ExperimentShell>
      <Component />
    </ExperimentShell>
  );
}

// Generate static params for all experiments
export function generateStaticParams() {
  return experiments.map(e => ({ slug: e.slug }));
}
