import { useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCivic } from "@/lib/civic/store";
import { fmtTime } from "@/lib/civic/rules";
import type { CivicEntity } from "@/lib/civic/types";

const WORKER = "WKR-019";
const VEHICLE = "DL-01-AB-2042";
const ROUTE = "Ward 142 · Route 07";

export function CollectionModal({
  entity,
  open,
  onOpenChange,
}: {
  entity: CivicEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { recordCollection } = useCivic();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ time: string } | null>(null);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTimeout(() => setDone(null), 200);
  };

  const confirm = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 450));
    const event = recordCollection({
      entityId: entity.id,
      worker: WORKER,
      vehicle: VEHICLE,
      route: ROUTE,
      location: `${entity.servicePoint}, ${entity.ward}`,
    });
    setSubmitting(false);
    setDone({ time: fmtTime(event.timestamp) });
    toast.success("Collection recorded", {
      description: `${entity.id} · ${fmtTime(event.timestamp)} · Worker ${WORKER}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto size-10 text-normal" />
            <h2 className="mt-3 text-lg font-semibold">Collection recorded</h2>
            <p className="mt-1 text-sm text-muted-foreground">{done.time}</p>
            <p className="mono-id mt-2">{entity.id}</p>
            <p className="text-sm text-muted-foreground">Worker {WORKER}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              This event is now part of the entity history, the dashboard activity feed and the global
              event log.
            </p>
            <Button className="mt-4 w-full" onClick={() => close(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Record Collection</DialogTitle>
              <DialogDescription>
                Recorded against the entity's digital identity — no specialised hardware required.
              </DialogDescription>
            </DialogHeader>
            <dl className="divide-y divide-border rounded-md border border-border text-sm">
              {[
                ["Entity", entity.id],
                ["Worker", WORKER],
                ["Vehicle", VEHICLE],
                ["Route", ROUTE],
                ["Timestamp", fmtTime(new Date().toISOString())],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 px-3 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-muted-foreground">Location</dt>
                <dd className="flex items-center gap-1.5 font-medium">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  {entity.lat.toFixed(4)}, {entity.lng.toFixed(4)}
                </dd>
              </div>
            </dl>
            <p className="text-[11px] text-muted-foreground">Simulated GPS fix for the prototype.</p>
            <DialogFooter>
              <Button variant="secondary" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button onClick={confirm} disabled={submitting}>
                {submitting ? "Recording…" : "Confirm Collection"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
