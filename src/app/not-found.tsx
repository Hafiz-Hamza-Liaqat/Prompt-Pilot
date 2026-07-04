import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-state">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <p>
        <Link href="/">Return to Prompt Pilot home</Link>
      </p>
    </div>
  );
}
