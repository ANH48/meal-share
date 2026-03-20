import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-[#1E293B] font-mono">404</p>
        <h1 className="text-xl font-semibold text-[#1E293B]">Page Not Found</h1>
        <p className="text-sm text-[#64748B]">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/dashboard"
          className="inline-block mt-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#F97316] hover:bg-[#EA6A00] transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
