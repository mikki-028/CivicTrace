import { Megaphone, PackageCheck, ScanLine, Signal, Wifi, BatteryFull } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CivicEntity } from "@/lib/civic/types";

export function QrScanDialog({
  entity,
  open,
  onOpenChange,
  onRecordCollection,
  onReportIssue,
}: {
  entity: CivicEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordCollection: () => void;
  onReportIssue: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanLine className="size-4" /> After scanning the physical QR code
          </DialogTitle>
        </DialogHeader>

        <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border-4 border-foreground/85 bg-surface">
          <div className="flex items-center justify-between bg-foreground/85 px-4 py-1 text-[10px] text-background">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <Signal className="size-3" />
              <Wifi className="size-3" />
              <BatteryFull className="size-3" />
            </span>
          </div>

          <div className="space-y-4 px-4 py-5">
            <div className="text-center">
              <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                CivicTrace
              </p>
              <p className="mono-id mt-2 text-base">{entity.id}</p>
              <p className="text-sm">{entity.servicePoint}</p>
              <p className="text-xs text-muted-foreground">{entity.ward}</p>
            </div>

            <Button
              className="h-14 w-full justify-start text-left"
              onClick={() => {
                onOpenChange(false);
                onRecordCollection();
              }}
            >
              <PackageCheck className="size-5" />
              <span>
                <span className="block text-sm font-semibold">Record Collection</span>
                <span className="block text-[11px] opacity-80">For municipal workers</span>
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-14 w-full justify-start text-left"
              onClick={() => {
                onOpenChange(false);
                onReportIssue();
              }}
            >
              <Megaphone className="size-5" />
              <span>
                <span className="block text-sm font-semibold">Report an Issue</span>
                <span className="block text-[11px] text-muted-foreground">For citizens</span>
              </span>
            </Button>

            <p className="text-center text-[10px] text-muted-foreground">
              No app download. No account. No specialised hardware.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
