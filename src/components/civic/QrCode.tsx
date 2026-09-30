import { cn } from "@/lib/utils";

/** Deterministic QR-style visual for an entity id (prototype visual, not a scannable code). */
export function QrCode({ value, className }: { value: string; className?: string }) {
  const size = 21;
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) % 2147483647;

  let state = seed || 7;
  const noise: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    noise.push(((state >> 16) & 1) === 1);
  }

  const finders: [number, number][] = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];

  const cellState = (r: number, c: number): boolean => {
    for (const [r0, c0] of finders) {
      if (r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7) {
        const ring = Math.max(Math.abs(r - (r0 + 3)), Math.abs(c - (c0 + 3)));
        return ring === 3 || ring <= 1;
      }
    }
    return noise[r * size + c] ?? false;
  };

  return (
    <div
      className={cn("grid aspect-square w-full gap-px rounded-md bg-surface p-2", className)}
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      {Array.from({ length: size * size }, (_, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        return (
          <span
            key={i}
            className={cellState(r, c) ? "bg-foreground" : "bg-transparent"}
            style={{ borderRadius: 1 }}
          />
        );
      })}
    </div>
  );
}
