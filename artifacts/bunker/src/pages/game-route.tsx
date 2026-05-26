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

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 300);
}

async function captureCard(player: Parameters<typeof PlayerCard>[0]["player"], index: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 430px;
      background-color: #0d0d0d;
      font-family: 'Space Mono', monospace;
      z-index: -1;
    `;
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<PlayerCard player={player} index={index} />);

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(container, {
          backgroundColor: "#0d0d0d",
          scale: 2,
          useCORS: true,
          logging: false,
          width: 430,
          windowWidth: 430,
        });
        canvas.toBlob((blob) => {
          root.unmount();
          document.body.removeChild(container);
          if (blob) resolve(blob);
          else reject(new Error("toBlob failed"));
        }, "image/png");
      } catch (err) {
        root.unmount();
        document.body.removeChild(container);
        reject(err);
      }
    }, 600);
  });
}

export default function GameRoute({ id, gameData, setGameData }: GameRouteProps) {
  const [, setLocation] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    if (!gameData) setLocation("/");
  }, [gameData, setLocation]);

  const handleSaveCurrent = useCallback(async () => {
    if (!gameData) return;

    if (id === "hint") return;

    const toastId = "save-current";
    toast.loading("Сохранение...", { id: toastId });

    try {
      let blob: Blob;

      if (id === "0") {
        const el = cardRef.current;
        if (!el) throw new Error("No element");
        const canvas = await html2canvas(el, {
          backgroundColor: "#000000",
          scale: 2,
          useCORS: true,
          logging: false,
        });
        blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
        );
        triggerDownload(URL.createObjectURL(blob), "bunker-база.png");
      } else {
        const playerIndex = parseInt(id) - 1;
        const player = gameData.players[playerIndex];
        if (!player) throw new Error("Player not found");
        blob = await captureCard(player, parseInt(id));
        triggerDownload(URL.createObjectURL(blob), `досье-${id}-${player.profession}.png`);
      }

      toast.success("Сохранено!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Ошибка сохранения", { id: toastId });
    }
  }, [id, gameData]);

  const handleDownloadAll = useCallback(async () => {
    if (!gameData || isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    const toastId = "export-all";
    toast.loading(`Подготовка карточек (0/${gameData.players.length})...`, { id: toastId });

    try {
      const zip = new JSZip();

      for (let i = 0; i < gameData.players.length; i++) {
        const player = gameData.players[i]!;
        toast.loading(`Карточка ${i + 1}/${gameData.players.length}: ${player.profession}`, { id: toastId });
        setExportProgress(i + 1);

        const blob = await captureCard(player, i + 1);
        const name = `${String(i + 1).padStart(2, "0")}-${player.profession.replace(/[\s/\\?%*:|"<>]/g, "_")}.png`;
        zip.file(name, blob);
      }

      toast.loading("Создание ZIP...", { id: toastId });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(URL.createObjectURL(zipBlob), "bunker-cards.zip");
      toast.success(`Скачано ${gameData.players.length} карточек!`, { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Ошибка экспорта", { id: toastId });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
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
  const canSaveCurrent = id !== "hint";

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative">
      <div ref={cardRef} className="flex-1 overflow-y-auto pb-36 no-scrollbar">
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
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-black/95 backdrop-blur border-t border-white/10 p-3 z-40 space-y-2">
        {/* Progress bar */}
        {isExporting && (
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${(exportProgress / gameData.players.length) * 100}%` }}
            />
          </div>
        )}

        {/* Nav row */}
        <div className="flex justify-between items-center">
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

        {/* Download row */}
        <div className="flex gap-2">
          {canSaveCurrent && (
            <Button onClick={handleSaveCurrent} variant="ghost" size="sm"
              className="flex-1 h-8 text-[10px] text-white/50 hover:text-white/90 border border-white/10 gap-1.5">
              <Camera className="w-3 h-3" />
              Эту карточку
            </Button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isExporting}
                className="flex-1 h-8 text-[10px] text-green-400/80 hover:text-green-300 border border-green-900/40 hover:border-green-700/60 gap-1.5">
                {isExporting
                  ? <><Loader2 className="w-3 h-3 animate-spin" />{exportProgress}/{gameData.players.length}</>
                  : <><Download className="w-3 h-3" />Все карточки</>
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 bg-zinc-950 border-zinc-800 p-3" align="center" side="top">
              <p className="text-xs text-white/50 mb-3">
                Скачает ZIP со всеми <span className="text-white font-bold">{gameData.players.length}</span> карточками игроков в формате PNG
              </p>
              <Button onClick={handleDownloadAll} disabled={isExporting}
                className="w-full bg-green-900/60 hover:bg-green-800/70 text-green-200 border border-green-700/50 text-xs h-9 gap-2">
                <Download className="w-3.5 h-3.5" />
                Скачать ZIP
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
