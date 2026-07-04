// Placeholder ad rail. Reserves the space and shows a labeled box until a real
// ad network (e.g. Google AdSense) is wired in. To go live: create the unit in
// AdSense, then replace the inner box with the <ins class="adsbygoogle"> markup
// and load the adsbygoogle script once in app/layout.tsx.
export default function AdSlot({ label }: { label: string }) {
  return (
    <aside
      aria-label="Advertisement"
      className="sticky top-20 hidden h-[600px] w-40 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center lg:flex xl:w-48"
    >
      <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
        Advertisement
      </span>
      <span className="px-3 text-xs text-zinc-700">{label}</span>
      <span className="text-[10px] text-zinc-800">160 × 600</span>
    </aside>
  );
}
