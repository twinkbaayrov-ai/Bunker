import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <Card className="w-full max-w-md mx-4 bg-zinc-950 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-white">404</h1>
          </div>
          <p className="mt-2 text-sm text-zinc-400">Страница не найдена</p>
          <Button onClick={() => setLocation("/")} className="mt-6 w-full" variant="outline">
            На главную
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
