import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { GameData } from "@workspace/api-client-react";
import Home from "@/pages/home";
import GameRoute from "@/pages/game-route";

const queryClient = new QueryClient();

function Router() {
  const [gameData, setGameData] = useState<GameData | null>(null);

  return (
    <Switch>
      <Route path="/">
        <Home gameData={gameData} setGameData={setGameData} />
      </Route>
      <Route path="/game/:id">
        {(params) => <GameRoute id={params.id} gameData={gameData} setGameData={setGameData} />}
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
          <div className="dark bg-background text-foreground min-h-[100dvh] flex flex-col font-mono selection:bg-primary selection:text-primary-foreground max-w-[430px] mx-auto w-full relative border-x border-border shadow-2xl">
            <div className="crt-overlay" />
            <Router />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
