import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import Emails from "@/pages/emails";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import ByFit from "@/pages/views/by-fit";
import ByInterest from "@/pages/views/by-interest";
import ByWeek from "@/pages/views/by-week";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/emails" component={Emails} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/views/by-fit" component={ByFit} />
      <Route path="/views/by-interest" component={ByInterest} />
      <Route path="/views/by-week" component={ByWeek} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
