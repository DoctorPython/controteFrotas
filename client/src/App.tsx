import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";

import Dashboard from "@/pages/dashboard";
import HistoryPage from "@/pages/history";
import GeofencesPage from "@/pages/geofences";
import AlertsPage from "@/pages/alerts";
import ReportsPage from "@/pages/reports";
import VehiclesPage from "@/pages/vehicles";
import TestTrackingPage from "@/pages/test-tracking";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

function getPageTitle(path: string): string {
  const titles: Record<string, string> = {
    "/": "Dashboard",
    "/vehicles": "Veículos",
    "/history": "Histórico",
    "/geofences": "Geofences",
    "/alerts": "Alertas",
    "/reports": "Relatórios",
    "/test-tracking": "Teste de Rastreamento",
  };
  
  return titles[path] || "FleetTrack";
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const title = getPageTitle(location);

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "3rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="h-6 w-px bg-border" />
              <h2 className="font-semibold hidden sm:block">{title}</h2>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/vehicles">
        <ProtectedRoute>
          <AppLayout>
            <VehiclesPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute>
          <AppLayout>
            <HistoryPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/geofences">
        <ProtectedRoute requiredRole={["admin"]}>
          <AppLayout>
            <GeofencesPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/alerts">
        <ProtectedRoute>
          <AppLayout>
            <AlertsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute requiredRole={["admin"]}>
          <AppLayout>
            <ReportsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/test-tracking">
        <ProtectedRoute>
          <AppLayout>
            <TestTrackingPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
          </TooltipProvider>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
