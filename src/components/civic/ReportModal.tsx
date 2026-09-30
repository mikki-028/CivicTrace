import { useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { useCivic } from "@/lib/civic/store";
import { reportStatusFor } from "@/lib/civic/rules";
import type { CivicEntity, IssueType } from "@/lib/civic/types";

const ISSUES: IssueType[] = [
  "Overflowing",
  "Waste not collected",
  "Mixed waste observed",
  "Improper dumping",
  "Other",
];

export function ReportModal({
  entity,
  open,
  onOpenChange,
}: {
  entity: CivicEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { submitReport, events } = useCivic();
  const [issue, setIssue] = useState<IssueType>("Overflowing");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next)
      setTimeout(() => {
        setDone(false);
        setNote("");
        setPhoto(false);
        setIssue("Overflowing");
      }, 200);
  };

  const submit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    submitReport({ entityId: entity.id, issueType: issue, note: note || undefined, hasPhoto: photo });
    setSubmitting(false);
    setDone(true);
    toast.success("Report recorded", { description: `${entity.id} · ${issue} · Unverified` });
  };

  const patternStatus = reportStatusFor(events, entity.id);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto size-10 text-normal" />
            <h2 className="mt-3 text-lg font-semibold">Report recorded</h2>
            <div className="mt-2 flex justify-center">
              <StatusBadge status="pending" label="Unverified" size="sm" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Your report has been linked to {entity.id} and will be reviewed by the relevant municipal
              authority.
            </p>
            {patternStatus !== "pending" && patternStatus !== "normal" && (
              <div className="mt-4 rounded-md border border-border bg-surface-muted px-3 py-2 text-xs">
                Repeated reports on this entity have raised it to{" "}
                <StatusBadge status={patternStatus} size="sm" className="mx-1 align-middle" /> for
                municipal review.
              </div>
            )}
            <p className="mt-4 text-[11px] text-muted-foreground">
              CivicTrace detects patterns. MCD verifies.
            </p>
            <Button className="mt-4 w-full" onClick={() => close(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>
                No app download, no account registration — the entity is identified by its QR code.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Entity</p>
              <p className="mono-id mt-0.5">{entity.id}</p>
              <p className="text-xs text-muted-foreground">
                {entity.servicePoint}, {entity.ward}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Issue type</Label>
              <RadioGroup value={issue} onValueChange={(v) => setIssue(v as IssueType)}>
                {ISSUES.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-accent"
                  >
                    <RadioGroupItem value={option} />
                    {option}
                  </label>
                ))}
              </RadioGroup>
            </div>

            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note (not required)"
              rows={2}
            />

            <Button
              type="button"
              variant={photo ? "secondary" : "outline"}
              className="w-full justify-start"
              onClick={() => setPhoto((p) => !p)}
            >
              <Camera className="size-4" />
              {photo ? "Photo evidence attached (simulated)" : "Add Photo Evidence (optional)"}
            </Button>

            <DialogFooter>
              <Button variant="secondary" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Report"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
