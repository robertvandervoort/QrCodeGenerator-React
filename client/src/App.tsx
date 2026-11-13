import { useEffect } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import LibraryTest from "@/components/QrCodeGenerator/LibraryTest";
import { trackPageView } from "@/lib/rum";

function RumListener() {
  const [location] = useLocation();
  useEffect(() => {
    trackPageView(location);
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/test" component={LibraryTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative">
        <RumListener />
        <div className="absolute top-2 right-4 bg-gray-100 p-2 rounded-md z-10 flex space-x-4">
          <Link href="/" className="text-blue-600 hover:underline">
            Home
          </Link>
          <Link href="/test" className="text-blue-600 hover:underline">
            QR Test
          </Link>
        </div>
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
