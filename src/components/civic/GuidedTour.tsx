import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "civictrace.tour.v1";

type Step = {
  section: string;
  path: string;
  search?: Record<string, string>;
  target?: string;
  closest?: string;
  title: string;
  body: ReactNode;
  action?: "open-ward" | "why-flagged";
};

const STEPS: Step[] = [
  { section: "Overview", path: "/", target: '[data-tour="nav-/"]', title: "Overview", body: "Your municipal command center. Monitor activity, key metrics and issues requiring attention across the selected ward." },
  { section: "Overview", path: "/", target: '[data-tour="kpis"]', title: "Key metrics", body: "Ward-level counts for assets, BWGs, collections, citizen reports and active attention flags." },
  { section: "Overview", path: "/", target: '[data-tour="overview-map"]', title: "Map snapshot", body: "A quick geographic view of Ward 142. Markers update as collections, reports and verifications are recorded." },
  { section: "Overview", path: "/", target: '[data-tour="attention"]', title: "Requires Attention", body: "Patterns CivicTrace has detected for MCD review — each one explains why it was flagged." },
  { section: "Ward", path: "/", target: '[data-tour="ward"]', action: "open-ward", title: "Ward selector", body: "Change your working ward to explore its operational and geographic context. Demo data is available for Ward 142." },
  { section: "Waste Assets", path: "/assets", target: '[data-tour="nav-/assets"]', title: "Waste Assets", body: "Explore every digitally identified municipal waste asset, including its location, status, collections, reports and maintenance." },
  { section: "Waste Assets", path: "/assets", target: 'a[href="/assets/BIN-0037"]', closest: "tr", title: "BIN-0037", body: "A bin with recurring post-collection overflow. Next, the tour opens its entity page." },
  { section: "Digital Identity", path: "/assets/BIN-0037", target: '[data-tour="entity-identity"]', title: "Digital identity", body: "Every physical waste entity has one persistent digital identity connecting its location, events, status and history." },
  { section: "Digital Identity", path: "/assets/BIN-0037", target: "#entity-history", title: "Entity history", body: "Every collection, report and inspection for BIN-0037 stays attached to this one identity." },
  { section: "BWGs", path: "/bwgs", target: 'a[href="/bwgs/BWG-0142"]', closest: "tr", title: "Bulk Waste Generators", body: "Bulk Waste Generators use the same identity and event model as municipal waste assets." },
  { section: "BWGs", path: "/bwgs/BWG-0142", target: '[data-tour="bwg-profile"]', title: "BWG-0142", body: "Registration, collection, inspection, reports and compliance information — all on one record." },
  {
    section: "Citizen Reports", path: "/reports", target: '[data-tour="reports-log"]', title: "Citizen Reports",
    body: (
      <>
        Citizens report issues through the QR-based flow without needing a separate app.
        <span className="mt-2 block font-medium text-foreground">Unverified → Requires Attention → Priority Review</span>
        <span className="mt-1 block">One report does not automatically mean failure.</span>
      </>
    ),
  },
  { section: "Event History", path: "/events", target: '[data-tour="events-log"]', title: "Event History", body: "Collections, reports, inspections, maintenance and other events remain connected to the same entity over time." },
  { section: "GIS Map", path: "/map", search: { entity: "BIN-0037" }, target: ".leaflet-container", title: "GIS Map", body: "Explore where assets and BWGs are located. Ward 142 is outlined; use filters, zoom, pan and reset, and click any marker." },
  { section: "GIS Map", path: "/map", search: { entity: "BIN-0037" }, target: '[data-tour="gis-selected"]', title: "Connected to history", body: "Selecting BIN-0037 on the map shows its status and recent history, linking straight to the entity." },
  { section: "Attention Queue", path: "/queue", target: '[data-tour="flag-BIN-0037:R1"]', title: "Attention Queue", body: "CivicTrace surfaces patterns that require administrative attention — like recurring post-collection overflow at BIN-0037." },
  { section: "Attention Queue", path: "/queue", target: '[data-tour="flag-BWG-0142:R4"]', title: "Repeated compliance concern", body: "BWG-0142 shows a repeated compliance concern. Nothing is penalised automatically." },
  { section: "Attention Queue", path: "/queue", target: '[data-tour="flag-BIN-0037:R1"]', action: "why-flagged", title: "Why was this flagged?", body: "Each flag opens its supporting evidence so MCD officials can verify before acting." },
];

type TourCtx = { start: () => void; completed: boolean };
const Ctx = createContext<TourCtx>({ start: () => {}, completed: false });
export const useGuidedTour = () => useContext(Ctx);

type Phase = "idle" | "welcome" | "running" | "done";

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [completed, setCompleted] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "completed" || v === "skipped") setCompleted(v === "completed");
    else setPhase("welcome");
  }, []);

  const finish = useCallback((value: "completed" | "skipped") => {
    localStorage.setItem(STORAGE_KEY, value);
    if (value === "completed") setCompleted(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }, []);

  const start = useCallback(() => {
    setIndex(0);
    setPhase("running");
  }, []);

  return (
    <Ctx.Provider value={{ start, completed }}>
      {children}
      {phase === "welcome" && (
        <Welcome
          onStart={start}
          onSkip={() => {
            finish("skipped");
            setPhase("idle");
          }}
        />
      )}
      {phase === "running" && (
        <TourRunner
          index={index}
          setIndex={setIndex}
          onSkip={() => {
            finish("skipped");
            setPhase("idle");
          }}
          onDone={() => {
            finish("completed");
            setPhase("done");
          }}
        />
      )}
      {phase === "done" && <Completion onClose={() => setPhase("idle")} />}
    </Ctx.Provider>
  );
}

function Modal({ children }: { children: ReactNode }) {
  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/40 p-4">
      <div role="dialog" aria-modal="true" className="panel w-full max-w-md bg-surface p-6 shadow-raised">
        {children}
      </div>
    </div>,
    document.body,
  );
}

function Welcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const items = ["Overview dashboard", "Waste Assets", "BWGs", "Citizen Reports", "Event History", "GIS Map", "Attention Queue", "Ward selection"];
  return (
    <Modal>
      <p className="text-xs font-medium tracking-wide text-primary uppercase">Guided demo</p>
      <h2 className="mt-1 text-xl font-semibold">Welcome to CivicTrace</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Explore how municipal waste activity becomes connected, traceable and actionable.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            {i}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
        <Button onClick={onStart}>Start Guided Tour</Button>
      </div>
    </Modal>
  );
}

function Completion({ onClose }: { onClose: () => void }) {
  const chain = ["Identity", "Events", "History", "GIS", "Intelligence"];
  return (
    <Modal>
      <h2 className="text-center text-xl font-semibold">That's CivicTrace.</h2>
      <div className="mt-4 flex flex-col items-center gap-0.5 text-sm">
        {chain.map((c, i) => (
          <span key={c} className="flex flex-col items-center">
            <span className="font-medium">{c}</span>
            {i < chain.length - 1 && <span className="text-muted-foreground">↓</span>}
          </span>
        ))}
      </div>
      <p className="mt-5 rounded-md border border-border bg-surface-muted px-3 py-2 text-center text-sm font-medium">
        CivicTrace Detects → MCD Verifies → Existing MCD Processes Act
      </p>
      <div className="mt-6 flex justify-center">
        <Button onClick={onClose}>Explore CivicTrace</Button>
      </div>
    </Modal>
  );
}

function TourRunner({
  index,
  setIndex,
  onSkip,
  onDone,
}: {
  index: number;
  setIndex: (n: number) => void;
  onSkip: () => void;
  onDone: () => void;
}) {
  const step = STEPS[index]!;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (pathname !== step.path) {
      void navigate({ to: step.path, search: (step.search ?? {}) as never });
    }
  }, [step, pathname, navigate]);

  // Locate the target, scroll it into view, and keep its rect updated.
  useLayoutEffect(() => {
    setRect(null);
    let el: Element | null = null;
    let acted = false;
    let scrolled = false;
    const tick = () => {
      if (pathname !== step.path || !step.target) return;
      const found = document.querySelector(step.target);
      el = found && step.closest ? (found.closest(step.closest) ?? found) : found;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setRect(null);
        return;
      }
      if (!scrolled) {
        scrolled = true;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      setRect(r);
      if (!acted && step.action) {
        acted = true;
        window.setTimeout(() => runAction(step, el), 450);
      }
    };
    tick();
    const id = window.setInterval(tick, 150);
    return () => window.clearInterval(id);
  }, [step, pathname]);

  const leave = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  const go = (n: number) => {
    leave();
    if (n >= STEPS.length) onDone();
    else setIndex(Math.max(0, n));
  };

  const pad = 6;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardW = Math.min(340, vw - 24);
  let cardStyle: React.CSSProperties = { left: (vw - cardW) / 2, top: vh / 2 - 100, width: cardW };
  if (rect) {
    const below = rect.bottom + pad + 12;
    const fitsBelow = below + 200 < vh;
    const top = fitsBelow ? below : Math.max(12, rect.top - pad - 12 - 210);
    const left = Math.min(Math.max(12, rect.left), vw - cardW - 12);
    cardStyle = { left, top: Math.min(top, vh - 220), width: cardW };
  }

  useEffect(() => {
    document.documentElement.classList.add("tour-active");
    return () => document.documentElement.classList.remove("tour-active");
  }, []);

  if (step.action === "open-ward" && rect) {
    cardStyle = { left: Math.max(12, rect.right - 200 - cardW), top: rect.bottom + 12, width: cardW };
  }
  if (step.action === "why-flagged") {
    cardStyle = { left: (vw - cardW) / 2, top: vh - 230, width: cardW };
  }

  return createPortal(
    <>
    <div className="pointer-events-none fixed inset-0 z-[1000]">
      {rect ? (
        <div
          className="absolute rounded-lg ring-2 ring-primary transition-all duration-200"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px color-mix(in oklch, var(--color-foreground) 45%, transparent)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-foreground/45" />
      )}
    </div>
      <div
        role="dialog"
        aria-label={step.title}
        className="tour-card pointer-events-auto fixed z-[1002] panel bg-surface p-4 shadow-raised"
        style={cardStyle}
      >
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-primary">{step.section}</span>
          <span className="tabular-nums">
            {index + 1} / {STEPS.length}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
        </div>
        <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
        <div className="mt-1 text-sm text-muted-foreground">{step.body}</div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button size="sm" variant="ghost" onClick={() => { leave(); onSkip(); }}>
            Skip Tour
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={index === 0} onClick={() => go(index - 1)}>
              Back
            </Button>
            <Button size="sm" onClick={() => go(index + 1)}>
              {index === STEPS.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function runAction(step: Step, el: Element | null) {
  if (!el) return;
  if (step.action === "open-ward") {
    const opts = { bubbles: true, cancelable: true, button: 0, pointerType: "mouse" } as const;
    el.dispatchEvent(new PointerEvent("pointerdown", opts));
  }
  if (step.action === "open-ward" && rect) {
    cardStyle = { left: Math.max(12, rect.right - 200 - cardW), top: rect.bottom + 12, width: cardW };
  }
  if (step.action === "why-flagged") {
    const btn = Array.from(el.querySelectorAll("button")).find((b) => b.textContent?.includes("Why flagged"));
    btn?.click();
  }
}
