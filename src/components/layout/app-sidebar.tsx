'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Calculator,
  Zap,
  Server,
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

  const content = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      className={cn(
        "transition-colors",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      )}
    >
      <Link href={href}>
        <Icon className="shrink-0" />
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  );

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return <SidebarMenuItem>{content}</SidebarMenuItem>;
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
    <Sidebar collapsible="icon" variant="sidebar">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border py-3 px-3">
        <Link
          href="/"
          className="flex items-center gap-3 min-w-0 overflow-hidden"
        >
          <Logo className="h-7 w-7 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-bold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              MapMyLED
            </span>
          )}
        </Link>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="py-2">
        <SidebarMenu>
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
            <SidebarSeparator />
            <SidebarMenu>
              <NavItem
                href="/admin/products"
                label="Admin"
                icon={ShieldCheck}
                isActive={isActive("/admin")}
              />
            </SidebarMenu>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border py-2">
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton onClick={signOut}>
                      <LogOut className="shrink-0" />
                      <span>Sign Out</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuButton onClick={signOut}>
                  <LogOut className="shrink-0" />
                  <span>Sign Out</span>
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
