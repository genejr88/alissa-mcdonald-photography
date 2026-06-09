import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-start justify-center px-6 md:px-12">
      <p className="meta">№ 404</p>
      <h1 className="mt-4 font-display text-[clamp(2.5rem,8vw,6rem)] font-light leading-none tracking-[-0.03em]">
        This frame is empty.
      </h1>
      <Link to="/" className="link-draw meta mt-10">
        ← Back to the beginning
      </Link>
    </div>
  );
}
