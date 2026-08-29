import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Products from "./pages/Products";
import CashFlow from "./pages/CashFlow";
import SmartSheet from "./pages/SmartSheet";
import Reports from "./pages/Reports";
import AIAssistant from "./pages/AIAssistant";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/pricing">
        <AppLayout><Pricing /></AppLayout>
      </Route>
      <Route path="/products">
        <AppLayout><Products /></AppLayout>
      </Route>
      <Route path="/cashflow">
        <AppLayout><CashFlow /></AppLayout>
      </Route>
      <Route path="/smartsheet">
        <AppLayout><SmartSheet /></AppLayout>
      </Route>
      <Route path="/reports">
        <AppLayout><Reports /></AppLayout>
      </Route>
      <Route path="/ai">
        <AppLayout><AIAssistant /></AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout><Profile /></AppLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
