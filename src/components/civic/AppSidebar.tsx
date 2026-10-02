import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Map,
  Megaphone,
  Settings,
  ScrollText,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCivic } from "@/lib/civic/store";

const NAV = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Waste Assets", url: "/assets", icon: Trash2 },
  { title: "BWGs", url: "/bwgs", icon: Building2 },
  { title: "Citizen Reports", url: "/reports", icon: Megaphone },
  { title: "Event History", url: "/events", icon: ScrollText },
  { title: "GIS Map", url: "/map", icon: Map },
  { title: "Attention Queue", url: "/queue", icon: TriangleAlert },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { official, totals, resetDemo } = useCivic();

  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Trash2 className="size-4" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">CivicTrace</span>
              <span className="block truncate text-[11px] text-sidebar-foreground/60">
                Digital Waste Intelligence
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Operations</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2" data-tour={`nav-${item.url}`}>
                      <item.icon className="size-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && item.url === "/queue" && totals.flags > 0 && (
                        <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 text-[10px] font-semibold text-sidebar-primary-foreground">
                          {totals.flags}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-2 pt-1 pb-2">
            <p className="text-sm font-medium">{official.name}</p>
            <p className="text-[11px] text-sidebar-foreground/60">
              {official.ward} · {official.role}
            </p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              onClick={() => {
                resetDemo();
                toast.success("Prototype data reset to the demo baseline");
              }}
            >
              <Settings className="size-4" />
              {!collapsed && <span>Settings · Reset demo data</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={() => toast.info("Logout is disabled in the prototype session")}
            >
              <LogOut className="size-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
