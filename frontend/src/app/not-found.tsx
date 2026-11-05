import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow">SSC13BD / 404</span>
      <h1>A little off the map.</h1>
      <p>Let’s get you back to your batchmates.</p>
      <Link className="button primary" href="/">
        Back to the community
      </Link>
    </main>
  );
}
