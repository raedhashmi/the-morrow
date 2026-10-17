import { Logo } from "@/components/logo";

const headlines = [
  { kicker: "Technology", title: "The quiet revolution in on-device AI", src: "The Verge" },
  { kicker: "Markets", title: "Why the rupee rally caught analysts off guard", src: "Dawn" },
  { kicker: "Science", title: "A telescope sees the universe's first light", src: "Nature" },
];

export function AuthShowcase() {
  return (
    <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
      <Logo />

      <div className="relative mx-auto w-full max-w-lg">
        {/* floating front page */}
        <div className="glass-strong sheen relative rotate-[-2.5deg] rounded-3xl p-7 transition-transform duration-700 hover:rotate-0">
          <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.25em] text-champagne/80">
            <span>No. 128</span>
            <span>Saturday Edition</span>
          </div>
          <div className="rule-double my-3" />
          <div className="masthead text-center text-5xl text-cream">The Morrow</div>
          <div className="rule-double my-3" />
          <div className="grid grid-cols-5 gap-5">
            <div className="col-span-3 border-r border-white/10 pr-5">
              <div className="kicker">Your lead</div>
              <h3 className="masthead mt-2 text-2xl leading-tight text-cream">
                Seven stories chosen for you, and one you didn&apos;t see coming
              </h3>
              <p className="dropcap mt-3 text-[0.82rem] leading-relaxed text-cream/70">
                Each morning the paper reads the web on your behalf, keeps what matters to you, and lets the rest go.
              </p>
            </div>
            <div className="col-span-2 space-y-3.5">
              {headlines.map((h) => (
                <div key={h.title} className="border-b border-white/10 pb-3 last:border-0">
                  <div className="text-[0.6rem] uppercase tracking-[0.2em] text-wine-300">{h.kicker}</div>
                  <div className="font-serif text-sm leading-snug text-cream/90">{h.title}</div>
                  <div className="mt-0.5 text-[0.6rem] text-cream/40">{h.src}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* stacked sheets behind */}
        <div className="glass absolute inset-0 -z-10 translate-x-6 translate-y-6 rotate-[3deg] rounded-3xl opacity-60" />
        <div className="glass absolute inset-0 -z-20 translate-x-12 translate-y-12 rotate-[7deg] rounded-3xl opacity-30" />
      </div>

      <blockquote className="max-w-md">
        <p className="masthead text-2xl leading-snug text-cream/90">
          &ldquo;One paper. Everything I care about. Nothing I don&apos;t.&rdquo;
        </p>
        <footer className="mt-3 text-xs uppercase tracking-[0.2em] text-champagne/70">The idea behind The Morrow</footer>
      </blockquote>
    </div>
  );
}
