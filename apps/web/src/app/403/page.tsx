import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-[#F97316] font-mono">403</p>
        <h1 className="text-xl font-semibold text-[#1E293B]">Access Denied</h1>
        <p className="text-sm text-[#64748B]">You don&apos;t have permission to view this page.</p>
        <Link
          href="/dashboard"
          className="inline-block mt-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#F97316' }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
