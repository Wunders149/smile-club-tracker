import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "./pages/Dashboard";
import Volunteers from "./pages/Volunteers";
import Events from "./pages/Events";
import Attendance from "./pages/Attendance";
import Rankings from "./pages/Rankings";
import Statistics from "./pages/Statistics";
import Badges from "./pages/Badges";
import Organigram from "./pages/Organigram";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/volunteers" component={Volunteers} />
      <Route path="/events" component={Events} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/rankings" component={Rankings} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/badges" component={Badges} />
      <Route path="/organigram" component={Organigram} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
