import { redirect } from 'next/navigation';
import { experiments } from '@/data/experiments';

export default function Home() {
  const latest = experiments[0];
  if (latest) {
    redirect(`/experiments/${latest.slug}`);
  }
  return null;
}
