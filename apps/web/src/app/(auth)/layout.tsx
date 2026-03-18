import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand Panel */}
      <div
        className="hidden lg:flex lg:w-[38%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
      >
        {/* Background decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white opacity-5 pointer-events-none" />
        <div className="absolute bottom-[-40px] left-[-60px] w-80 h-80 rounded-full bg-white opacity-5 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2C7 2 3 6 3 11c0 3.5 2 6.5 5 8v2a1 1 0 001 1h6a1 1 0 001-1v-2c3-1.5 5-4.5 5-8 0-5-4-9-9-9z" fill="white" fillOpacity="0.9"/>
              <path d="M9 11h6M12 8v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">MealShare</span>
        </div>

        {/* Tagline + features */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <h1 className="text-white font-bold text-[2.25rem] leading-tight">
              Group meal management,<br />simplified.
            </h1>
            <p className="text-[#FED7AA] text-base leading-relaxed">
              Track expenses, vote on menus, and chat with your team — all in one place.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Track group meal expenses' },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'Vote on weekly menus' },
              { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', label: 'Real-time group chat' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={icon} />
                </svg>
                <span className="text-white text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom caption */}
        <p className="relative z-10 text-[#FED7AA] text-xs">
          © 2026 MealShare. Trusted by teams everywhere.
        </p>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[480px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F97316' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M12 2C7 2 3 6 3 11c0 3.5 2 6.5 5 8v2a1 1 0 001 1h6a1 1 0 001-1v-2c3-1.5 5-4.5 5-8 0-5-4-9-9-9z"/>
              </svg>
            </div>
            <span className="font-bold text-lg text-[#1E293B]">MealShare</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
