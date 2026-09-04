import { Sprout } from 'lucide-react';

export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-mandi-600 text-white shadow-soft">
        <Sprout className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-bold text-mandi-950">Vidarbha Mandi AI</span>
        <span className="block text-[10px] font-medium uppercase tracking-wider text-harvest-600">
          Vidarbha · Maharashtra
        </span>
      </span>
    </span>
  );
}
