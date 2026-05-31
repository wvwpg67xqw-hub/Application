import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getGetMeQueryKey, useGetMe } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ApplyServer from "@/pages/apply-server";
import ApplyPosition from "@/pages/apply-position";
import ApplicationDetail from "@/pages/application-detail";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminApplications from "@/pages/admin/applications";
import AdminPositions from "@/pages/admin/positions";
import AdminSettings from "@/pages/admin/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { data: user, isLoading, error } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#36393F" }}>
        <div className="w-8 h-8 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return <Redirect to="/" />;
  }

  if (adminOnly && !["admin", "developer", "owner"].includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/apply/:guildId/:positionId">
        <ProtectedRoute component={ApplyPosition} />
      </Route>
      <Route path="/apply/:guildId">
        <ProtectedRoute component={ApplyServer} />
      </Route>
      <Route path="/applications/:id">
        <ProtectedRoute component={ApplicationDetail} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} adminOnly />
      </Route>
      <Route path="/admin/applications">
        <ProtectedRoute component={AdminApplications} adminOnly />
      </Route>
      <Route path="/admin/positions">
        <ProtectedRoute component={AdminPositions} adminOnly />
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute component={AdminSettings} adminOnly />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
