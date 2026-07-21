'use client';

export function FintracBadge() {
  return (
    <>
      <style>{`
        @keyframes badge-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes badge-shimmer {
          0%        { transform: translateX(-180%) skewX(-12deg); opacity: 0; }
          15%       { opacity: 1; }
          85%       { opacity: 1; }
          100%      { transform: translateX(180%) skewX(-12deg); opacity: 0; }
        }
        @keyframes badge-float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes dot-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.5); }
          50%      { box-shadow: 0 0 0 4px rgba(52,211,153,0); }
        }
        .badge-spin    { animation: badge-spin 4s linear infinite; }
        .badge-shimmer { animation: badge-shimmer 4s ease-in-out infinite; animation-delay: 1.2s; }
        .badge-float   { animation: badge-float 4s ease-in-out infinite; }
        .dot-glow      { animation: dot-glow 2s ease-in-out infinite; }
      `}</style>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/10" />

        {/* Floating wrapper */}
        <div className="badge-float relative">

          {/* Rotating conic ring */}
          <div className="absolute -inset-[1.5px] overflow-hidden rounded-full">
            <div
              className="badge-spin absolute origin-center"
              style={{
                inset: '-60%',
                background:
                  'conic-gradient(from 0deg, transparent 0%, rgba(52,211,153,0.7) 15%, transparent 30%, rgba(52,211,153,0.25) 55%, transparent 70%)',
              }}
            />
          </div>

          {/* Outer glow */}
          <div
            className="absolute -inset-[3px] rounded-full opacity-40 blur-md"
            style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.35) 0%, transparent 70%)' }}
          />

          {/* Badge body */}
          <span className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#07101f] px-4 py-1.5">
            {/* Shimmer sweep */}
            <span className="badge-shimmer pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/14 to-transparent" />

            {/* Live dot */}
            <span className="relative flex h-2 w-2 flex-none">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="dot-glow relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
              FINTRAC
            </span>

          </span>
        </div>

        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/10" />
      </div>
    </>
  );
}
