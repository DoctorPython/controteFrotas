import { Map, History, Shield, Bell, BarChart3, Car, Truck, LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import type { Alert } from "@shared/schema";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const allMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: Map,
  },
  {
    title: "Veículos",
    url: "/vehicles",
    icon: Car,
    adminOnly: true,
  },
  {
    title: "Histórico",
    url: "/history",
    icon: History,
  },
  {
    title: "Geofences",
    url: "/geofences",
    icon: Shield,
    adminOnly: true,
  },
  {
    title: "Alertas",
    url: "/alerts",
    icon: Bell,
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    adminOnly: true,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAdmin, logout } = useAuth();
  
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 10000,
    enabled: !!user, // Só busca alertas se estiver autenticado
  });
  
  const unreadAlerts = alerts.filter(a => !a.read).length;

  // Filtrar itens do menu baseado em permissões
  const menuItems = allMenuItems.filter(item => {
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-sidebar-foreground">FleetTrack</h2>
            <p className="text-xs text-muted-foreground">Rastreamento em tempo real</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                const hasBadge = item.title === "Alertas" && unreadAlerts > 0;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        {hasBadge && (
                          <SidebarMenuBadge>
                            {unreadAlerts > 99 ? "99+" : unreadAlerts}
                          </SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
        {user && (
          <div className="flex items-center gap-3 rounded-lg p-3 hover-elevate active-elevate-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.username}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role === "admin" ? "Administrador" : "Usuário"}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}


