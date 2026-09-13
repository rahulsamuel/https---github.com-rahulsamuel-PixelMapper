'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Calculator,
  Zap,
  Server,
  Box,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/app", label: "Pixel Map", icon: LayoutGrid },
  { href: "/calculator", label: "LED Calculator", icon: Calculator },
  { href: "/power-data", label: "Power & Data", icon: Zap },
  { href: "/rack-drawing", label: "Rack Drawing", icon: Server },
  { href: "/pre-visual", label: "Pre-Visual", icon: Box },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  isActive: boolean;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const btn = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      className={cn(
        "h-9 rounded-lg transition-all duration-150",
        isActive
          ? "bg-primary/15 text-primary font-medium"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      <Link href={href} className="flex items-center gap-3">
        <Icon className="shrink-0 w-4 h-4" />
        <span className="text-sm">{label}</span>
      </Link>
    </SidebarMenuButton>
  );

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">{label}</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return <SidebarMenuItem>{btn}</SidebarMenuItem>;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r border-sidebar-border">
      {/* Logo header */}
      <SidebarHeader className="px-3 py-4">
        <Link href="/" className="flex items-center min-w-0 group">
          <Logo className="h-7 w-auto" showText={!collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="mx-0 opacity-50" />

      {/* Main nav */}
      <SidebarContent className="px-2 py-3">
        {!collapsed && (
          <div className="px-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
              Tools
            </span>
          </div>
        )}
        <SidebarMenu className="gap-0.5">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
              isActive={isActive(item.href, item.exact)}
            />
          ))}
        </SidebarMenu>

        {user && (
          <>
            <SidebarSeparator className="my-3 mx-0 opacity-40" />
            {!collapsed && (
              <div className="px-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
                  Admin
                </span>
              </div>
            )}
            <SidebarMenu>
              <NavItem
                href="/admin/products"
                label="Admin Panel"
                icon={ShieldCheck}
                isActive={isActive("/admin")}
              />
            </SidebarMenu>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-2 py-3 border-t border-sidebar-border/50">
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={signOut}
                      className="h-9 rounded-lg text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span className="text-sm">Sign Out</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Sign Out</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuButton
                  onClick={signOut}
                  className="h-9 rounded-lg text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="text-sm">Sign Out</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ) : (
            <NavItem
              href="/login"
              label="Login"
              icon={User}
              isActive={isActive("/login")}
            />
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
