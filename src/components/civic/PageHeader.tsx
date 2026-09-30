export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PrototypeNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] text-muted-foreground ${className}`}>
      <span className="font-semibold">Illustrative prototype data — not real MCD statistics.</span>{" "}
      Figures are demo data from the CivicTrace concept.
    </p>
  );
}

export function DetectVerifyActNote() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-xs">
      <span className="font-semibold text-normal">CivicTrace detects</span>
      <span className="text-muted-foreground">→</span>
      <span className="font-semibold">MCD verifies</span>
      <span className="text-muted-foreground">→</span>
      <span className="font-semibold">Existing MCD processes act</span>
      <span className="ml-auto text-muted-foreground">
        Administrative review signal, not a final determination.
      </span>
    </div>
  );
}
