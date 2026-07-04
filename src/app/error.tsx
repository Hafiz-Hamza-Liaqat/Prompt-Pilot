'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred. You can try again.</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
