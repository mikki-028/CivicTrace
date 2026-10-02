import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { useCivic } from "@/lib/civic/store";
import { fmtTime, severityToStatus } from "@/lib/civic/rules";
import { WARDS } from "@/lib/civic/seed";

export function TopBar() {
  const { entities, notifications, unreadCount, markNotificationsRead, ward, setWard, official, statusOf } =
    useCivic();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const results = query.trim()
    ? entities
        .filter((e) =>
          `${e.id} ${e.name} ${e.servicePoint} ${e.ward}`.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const openEntity = (id: string, kind: "asset" | "bwg") => {
    setSearchOpen(false);
    setQuery("");
    navigate({
      to: kind === "bwg" ? "/bwgs/$entityId" : "/assets/$entityId",
      params: { entityId: id },
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger />

      <Popover open={searchOpen && results.length > 0} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search entities, wards, service points…"
              className="h-9 pl-8"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-1">
          {results.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => openEntity(entity.id, entity.kind)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left hover:bg-surface-muted"
            >
              <span>
                <span className="mono-id block">{entity.id}</span>
                <span className="block text-xs text-muted-foreground">
                  {entity.servicePoint} · {entity.ward}
                </span>
              </span>
              <StatusBadge status={statusOf(entity.id)} size="sm" />
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" data-tour="ward">
              {ward}
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Current ward</DropdownMenuLabel>
            {WARDS.map((w) => (
              <DropdownMenuItem key={w} onClick={() => setWard(w)}>
                {w}
                {w !== official.ward && (
                  <span className="ml-2 text-[10px] text-muted-foreground">no prototype data</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu onOpenChange={(open) => open && markNotificationsRead()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-priority text-[9px] font-semibold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[320px]">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} asChild className="items-start gap-2">
                <Link
                  to={n.entityId.startsWith("BWG") ? "/bwgs/$entityId" : "/assets/$entityId"}
                  params={{ entityId: n.entityId }}
                >
                  <span className="min-w-0">
                    <span className="block text-xs leading-snug whitespace-normal">{n.message}</span>
                    <span className="mt-1 flex items-center gap-2">
                      {n.severity !== "info" && (
                        <StatusBadge status={severityToStatus(n.severity)} size="sm" />
                      )}
                      <span className="text-[10px] text-muted-foreground">{fmtTime(n.createdAt)}</span>
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                MO
              </span>
              <span className="hidden text-sm sm:inline">{official.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {official.name}
              <span className="block text-[11px] font-normal text-muted-foreground">
                {official.id} · {official.ward}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/queue">Attention Queue</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/events">Event History</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
