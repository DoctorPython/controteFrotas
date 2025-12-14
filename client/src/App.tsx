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

import Dashboard from "@/pages/dashboard";
import HistoryPage from "@/pages/history";
import GeofencesPage from "@/pages/geofences";
import AlertsPage from "@/pages/alerts";
import ReportsPage from "@/pages/reports";
import VehiclesPage from "@/pages/vehicles";
import TestTrackingPage from "@/pages/test-tracking";
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

function AppHeader() {
  const [location] = useLocation();
  const title = getPageTitle(location);

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div className="h-6 w-px bg-border" />
        <h2 className="font-semibold hidden sm:block">{title}</h2>
      </div>
      <ThemeToggle />
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/vehicles" component={VehiclesPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/geofences" component={GeofencesPage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/test-tracking" component={TestTrackingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:66',message:'App component render',data:{hasStyle:!!style},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // #region agent log
  React.useEffect(() => {
    const checkStyles = () => {
      const root = document.documentElement;
      const computedStyle = window.getComputedStyle(root);
      const bgColor = computedStyle.getPropertyValue('--background');
      const testElement = document.createElement('div');
      testElement.className = 'flex h-screen';
      document.body.appendChild(testElement);
      const testComputed = window.getComputedStyle(testElement);
      const hasFlex = testComputed.display === 'flex';
      const hasHeight = testComputed.height !== 'auto';
      document.body.removeChild(testElement);
      
      const styleSheets = Array.from(document.styleSheets);
      const cssContent: string[] = [];
      styleSheets.forEach((sheet, idx) => {
        try {
          if (sheet.href) cssContent.push(`Sheet ${idx}: ${sheet.href}`);
          if (sheet.cssRules) {
            const rules = Array.from(sheet.cssRules).slice(0, 5);
            rules.forEach(rule => {
              if (rule.cssText) cssContent.push(`Rule: ${rule.cssText.substring(0, 100)}`);
            });
          }
        } catch (e) {
          cssContent.push(`Sheet ${idx}: CORS error`);
        }
      });
      
      fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:72',message:'CSS check detailed',data:{bgColor,bgColorExists:!!bgColor,hasFlex,hasHeight,styleSheetsCount:styleSheets.length,cssContent:cssContent.slice(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    };
    setTimeout(checkStyles, 500);
  }, []);
  // #endregion

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <AppHeader />
                <main className="flex-1 overflow-hidden">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
