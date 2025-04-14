import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import Deals from "@/pages/deals";
import Tasks from "@/pages/tasks";
import Emails from "@/pages/emails";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/deals" component={Deals} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/emails" component={Emails} />
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
