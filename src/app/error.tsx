"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="shell">
      <h1>Let’s try that again.</h1>
      <p>
        The demo hit an unexpected error. Your portfolio is still available.
      </p>
      <button onClick={reset}>Try again</button>
      <a href="/">Back to portfolio</a>
    </main>
  );
}
