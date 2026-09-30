import { cn } from "@/lib/utils";

/** Deterministic QR-style visual for an entity id (prototype visual, not a scannable code). */
export function QrCode({ value, className }: { value: string; className?: string }) {
  const size = 21;
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) % 2147483647;

  const cells: boolean[] = [];
  let state = seed || 7;
  for (let i = 0; i < size * size; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    cells.push(((state >> 16) & 1) === 1);
  }

  const isFinder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) =>
      r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7 &&
      !(r > r0 + 1 && r < r0 + 5 && c > c0 + 1 && c < c0 + 5) === false
        ? false
        : r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };

  const finderOn = (r: number, c: number) => {
    const local = (r0: number, c0: number) => {
      const dr = r - r0;
      const dc = c - c0;
      const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
      return ring === 3 || ring <= 1;
    };
    if (r < 7 && c < 7) return local(0, 0);
    if (r < 7 && c >= size - 7) return local(0, size - 7);
    if (r >= size - 7 && c < 7) return local(size - 7, 0);
    return false;
  };

  return (
    <div
      className={cn("grid aspect-square w-full gap-px rounded-md bg-surface p-2", className)}
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      {cells.map((on, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        const filled = isFinder(r, c) ? finderOn(r, c) : on;
        return (
          <span
            key={i}
            className={filled ? "bg-foreground" : "bg-transparent"}
            style={{ borderRadius: 1 }}
          />
        );
      })}
    </div>
  );
}
