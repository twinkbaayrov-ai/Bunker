import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "wouter";
import { GameData } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import CardZero from "./card-zero";
import PlayerCard from "./player-card";
import HintCard from "./hint-card";
import { ChevronLeft, ChevronRight, Camera, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";

interface GameRouteProps {
  id: string;
  gameData: GameData | null;
  setGameData: (data: GameData) => void;
}

async function captureCard(
  player: Parameters<typeof PlayerCard>[0]["player"],
  index: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    container.style.cssText = [
      "position:fixed",
      "top:-9999px",
      "left:-9999px",
      "width:430px",
      "background-color:#0d0d0d",
      "font-family:'Space Mono',monospace",
      "z-index:-999",
      "visibility:visible",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<PlayerCard player={player} index={index} />);

    // Give more time on iOS (slower JS engines)
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
        canvas.toBlob(
          (blob) => {
            root.unmount();
            document.body.removeChild(container);
            if (blob) resolve(blob);
            else reject(new Error("toBlob вернул null"));
          },
          "image/png"
        );
      } catch (err) {
        root.unmount();
        document.body.removeChild(container);
        reject(err);
      }
    }, 900);
  });
}

async function shareOrSave(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });

  // iOS и Android — нативный шаринг (сохранить в Фото, AirDrop и т.д.)
  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({ files: [file], title: filename });
    return;
  }

  // Desktop — скачать напрямую
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 500);
}

export default function GameRoute({ id, gameData, setGameData }: GameRouteProps) {
  const [, setLocation] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharingAll, setIsSharingAll] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!gameData) setLocation("/");
  }, [gameData, setLocation]);

  const handleSaveCurrent = useCallback(async () => {
    if (!gameData || isSaving) return;
    setIsSaving(true);
    const toastId = "save-one";
    toast.loading("Готовлю изображение…", { id: toastId });

    try {
      let blob: Blob;
      let filename: string;

      if (id === "0") {
        const el = cardRef.current;
        if (!el) throw new Error("No ref");
        const canvas = await html2canvas(el, {
          backgroundColor: "#000000",
          scale: 2,
          useCORS: true,
          logging: false,
        });
        blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob null"))), "image/png")
        );
        filename = "bunker-база.png";
      } else {
        const playerIndex = parseInt(id) - 1;
        const player = gameData.players[playerIndex];
        if (!player) throw new Error("Player not found");
        blob = await captureCard(player, parseInt(id));
        filename = `досье-${id}-${player.profession}.png`;
      }

      toast.dismiss(toastId);
      await shareOrSave(blob, filename);
      toast.success("Готово!");
    } catch (e) {
      const err = e as Error;
      if (err.name === "AbortError") {
        toast.dismiss(toastId); // пользователь закрыл шаринг — это нормально
      } else {
        console.error(e);
        toast.error("Ошибка сохранения", { id: toastId });
      }
    } finally {
      setIsSaving(false);
    }
  }, [id, gameData, isSaving]);

  const handleShareAll = useCallback(async () => {
    if (!gameData || isSharingAll) return;
    setIsSharingAll(true);
    setProgress(0);
    const toastId = "share-all";
    toast.loading(`Готовлю (0/${gameData.players.length})…`, { id: toastId });

    try {
      const files: File[] = [];

      for (let i = 0; i < gameData.players.length; i++) {
        const player = gameData.players[i]!;
        toast.loading(`Карточка ${i + 1}/${gameData.players.length}…`, { id: toastId });
        setProgress(i + 1);
        const blob = await captureCard(player, i + 1);
        const name = `${String(i + 1).padStart(2, "0")}-${player.profession.replace(/[\s/\\?%*:|"<>]/g, "_")}.png`;
        files.push(new File([blob], name, { type: "image/png" }));
      }

      toast.dismiss(toastId);

      // iOS/Android — шарим все сразу
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files })
      ) {
        await navigator.share({ files, title: "Карточки Бункера" });
        toast.success(`${files.length} карточек готовы!`);
      } else {
        // Desktop — скачиваем по одной
        for (const file of files) {
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          await new Promise((r) => setTimeout(r, 200));
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        toast.success(`Скачано ${files.length} карточек!`);
      }
    } catch (e) {
      const err = e as Error;
      if (err.name !== "AbortError") {
        console.error(e);
        toast.error("Ошибка экспорта", { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setIsSharingAll(false);
      setProgress(0);
    }
  }, [gameData, isSharingAll]);

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

  const label =
    id === "0" ? "БАЗА" : id === "hint" ? "ПОДСКАЗКА" : `ДОСЬЕ ${id}/${gameData.players.length}`;
  const canSave = id !== "hint";
  const total = gameData.players.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative">
      {/* Scrollable card area */}
      <div ref={cardRef} className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: "9rem" }}>
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

      {/* Fixed bottom nav — safe area aware for iPhone */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-black/95 backdrop-blur border-t border-white/10 z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)", padding: "12px 12px env(safe-area-inset-bottom, 12px)" }}
      >
        {/* Progress bar */}
        {isSharingAll && (
          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
        )}

        {/* Arrow nav */}
        <div className="flex justify-between items-center mb-2">
          <Button
            variant="outline"
            onClick={handlePrev}
            size="sm"
            className="bg-transparent border-white/20 text-white hover:bg-white/10 h-9 px-3"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-[10px] font-mono text-white/40 tracking-widest">{label}</span>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={id === "hint"}
            size="sm"
            className="bg-transparent border-white/20 text-white hover:bg-white/10 h-9 px-3"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {canSave && (
            <Button
              onClick={handleSaveCurrent}
              disabled={isSaving || isSharingAll}
              variant="ghost"
              size="sm"
              className="flex-1 h-10 text-[11px] text-white/60 hover:text-white border border-white/10 gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              Эту карточку
            </Button>
          )}

          <Button
            onClick={handleShareAll}
            disabled={isSaving || isSharingAll}
            variant="ghost"
            size="sm"
            className="flex-1 h-10 text-[11px] text-green-400/80 hover:text-green-300 border border-green-900/50 hover:border-green-700/60 gap-1.5"
          >
            {isSharingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {progress}/{total}
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Все карточки
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
