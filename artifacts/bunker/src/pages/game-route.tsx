import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "wouter";
import { GameData } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import CardZero from "./card-zero";
import PlayerCard from "./player-card";
import HintCard from "./hint-card";
import { ChevronLeft, ChevronRight, Camera, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import html2canvas from "html2canvas";
import { createRoot } from "react-dom/client";
import JSZip from "jszip";
import { toast } from "sonner";

interface GameRouteProps {
  id: string;
  gameData: GameData | null;
  setGameData: (data: GameData) => void;
}

async function renderToCanvas(element: React.ReactElement, bgColor = "#0d0d0d"): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = "430px";
  container.style.backgroundColor = bgColor;
  container.style.fontFamily = "'Space Mono', monospace";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(element);

  await new Promise((r) => setTimeout(r, 400));

  const canvas = await html2canvas(container, {
    backgroundColor: bgColor,
    scale: 2,
    useCORS: true,
    logging: false,
    width: 430,
  });

  root.unmount();
  document.body.removeChild(container);
  return canvas;
}

export default function GameRoute({ id, gameData, setGameData }: GameRouteProps) {
  const [, setLocation] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!gameData) {
      setLocation("/");
    }
  }, [gameData, setLocation]);

  const handleSaveCurrent = useCallback(async () => {
    const el = cardRef.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: "#0d0d0d",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      const label = id === "0" ? "бункер" : id === "hint" ? "подсказка" : `досье-${id}`;
      link.download = `bunker-${label}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      toast.error("Ошибка сохранения");
    }
  }, [id]);

  const handleDownloadAll = useCallback(async () => {
    if (!gameData || isExporting) return;
    setIsExporting(true);
    toast("Подготовка карточек...", { duration: 99999, id: "export" });

    try {
      const zip = new JSZip();

      for (let i = 0; i < gameData.players.length; i++) {
        const player = gameData.players[i]!;
        toast(`Обработка ${i + 1}/${gameData.players.length}: ${player.profession}`, { id: "export" });
        const canvas = await renderToCanvas(
          <PlayerCard player={player} index={i + 1} />,
          "#0d0d0d"
        );
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        zip.file(`${String(i + 1).padStart(2, "0")}-${player.profession.replace(/\s+/g, "_")}.png`, blob);
      }

      toast("Генерация ZIP...", { id: "export" });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "bunker-cards.zip";
      link.click();

      toast.success("Все карточки скачаны!", { id: "export" });
    } catch (e) {
      toast.error("Ошибка при экспорте", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  }, [gameData, isExporting]);

  if (!gameData) return null;

  const handlePrev = () => {
    if (id === "hint") setLocation(`/game/${gameData.players.length}`);
    else if (id === "1") setLocation("/game/0");
    else if (id !== "0") setLocation(`/game/${parseInt(id) - 1}`);
    else setLocation("/");
  };

  const handleNext = () => {
    if (id === "0") setLocation("/game/1");
    else if (id !== "hint") {
      const nextId = parseInt(id) + 1;
      setLocation(nextId > gameData.players.length ? "/game/hint" : `/game/${nextId}`);
    }
  };

  const renderCard = () => {
    if (id === "0") return <CardZero gameData={gameData} setGameData={setGameData} />;
    if (id === "hint") return <HintCard gameData={gameData} />;
    const player = gameData.players[parseInt(id) - 1];
    return player ? <PlayerCard player={player} index={parseInt(id)} /> : null;
  };

  const label = id === "0" ? "БАЗА" : id === "hint" ? "ПОДСКАЗКА" : `ДОСЬЕ ${id}/${gameData.players.length}`;

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative">
      <div ref={cardRef} className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={id}
            initial={{ y: 20, opacity: 0, rotate: -1 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 1 }}
            transition={{ duration: 0.25 }}
            className="min-h-full p-4"
          >
            {renderCard()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-black/95 backdrop-blur border-t border-white/10 p-3 z-40">
        <div className="flex justify-between items-center mb-2">
          <Button variant="outline" onClick={handlePrev} size="sm"
            className="bg-transparent border-white/20 text-white hover:bg-white/10 h-9 px-3">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-[10px] font-mono text-white/50 tracking-widest">{label}</div>

          <Button variant="outline" onClick={handleNext} size="sm" disabled={id === "hint"}
            className="bg-transparent border-white/20 text-white hover:bg-white/10 h-9 px-3">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          {id !== "hint" && (
            <Button onClick={handleSaveCurrent} variant="ghost" size="sm"
              className="flex-1 h-8 text-[10px] text-white/40 hover:text-white/80 border border-white/10 gap-1.5">
              <Camera className="w-3 h-3" />
              Эту карточку
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isExporting}
                className="flex-1 h-8 text-[10px] text-green-400/70 hover:text-green-300 border border-green-900/30 hover:border-green-700/50 gap-1.5">
                {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Скачать всё
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 bg-zinc-950 border-zinc-800 p-2" align="center" side="top">
              <div className="text-xs text-white/50 px-1 py-1 mb-1">
                Скачает ZIP со всеми {gameData.players.length} карточками игроков
              </div>
              <Button onClick={handleDownloadAll} disabled={isExporting}
                className="w-full bg-green-900/50 hover:bg-green-800/60 text-green-300 border border-green-800/50 text-xs h-8">
                {isExporting ? "Генерация..." : `Скачать ${gameData.players.length} карточек`}
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
