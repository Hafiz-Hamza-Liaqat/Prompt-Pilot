import { siteConfig } from '../config/site';

export default function HomePage() {
  return (
    <main>
      <h1>{siteConfig.name}</h1>
      <p>{siteConfig.description}</p>
      <p className="notice">
        Prompt Pilot creates structured production plans, provider recommendations, prompts, and
        instructions. It does not generate videos or images.
      </p>
      <p className="status">Development status: Phase 2 — Next.js application foundation</p>
    </main>
  );
}
