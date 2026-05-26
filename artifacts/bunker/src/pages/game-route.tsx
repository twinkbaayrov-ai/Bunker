import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "wouter";
import { GameData } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import CardZero from "./card-zero";
import PlayerCard from "./player-card";
import HintCard from "./hint-card";
import { ChevronLeft, ChevronRight, Camera, Images, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";

interface GameRouteProps {
  id: string;
  gameData: GameData | null;
  setGameData: (data: GameData) => void;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

async function renderCardToBlob(
  player: Parameters<typeof PlayerCard>[0]["player"],
  index: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    // opacity:0 instead of -9999px so iOS Safari still lays it out
    container.style.cssText =
      "position:fixed;top:0;left:0;width:430px;opacity:0;pointer-events:none;z-index:-999;background:#0d0d0d;font-family:'Space Mono',monospace;";
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
        canvas.toBlob(
          (blob) => {
            root.unmount();
            document.body.removeChild(container);
            if (blob) resolve(blob);
            else reject(new Error("toBlob returned null"));
          },
          "image/png"
        );
      } catch (err) {
        root.unmount();
        document.body.removeChild(container);
        reject(err);
      }
    }, 1000);
  });
}

function openImageInTab(dataURL: string, title: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;display:flex;justify-content:center;align-items:flex-start;min-height:100vh}img{max-width:100%;height:auto;display:block}</style>
</head><body><img src="${dataURL}"></body></html>`;
  return html;
}

export default function GameRoute({ id, gameData, setGameData }: GameRouteProps) {
  const [, setLocation] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!gameData) setLocation("/");
  }, [gameData, setLocation]);

  // "Эту карточку" — capture visible DOM, open in new tab
  const handleSaveCurrent = useCallback(() => {
    if (!gameData || isSaving) return;

    // Open tab SYNCHRONOUSLY inside the user-gesture handler
    const win = window.open("about:blank", "_blank");
    if (!win) {
      toast.error("Разрешите открытие вкладок в браузере");
      return;
    }

    win.document.write(
      "<html><body style='margin:0;background:#111;color:#4ade80;font-family:monospace;padding:20px'>Генерирую изображение…</body></html>"
    );

    setIsSaving(true);

    (async () => {
      try {
        let dataURL: string;

        if (id === "0") {
          const el = cardRef.current;
          if (!el) throw new Error("no ref");
          const canvas = await html2canvas(el, {
            backgroundColor: "#000",
            scale: 2,
            useCORS: true,
            logging: false,
            height: el.scrollHeight,
            windowHeight: el.scrollHeight,
          });
          dataURL = canvas.toDataURL("image/png");
        } else {
          const playerIndex = parseInt(id) - 1;
          const player = gameData.players[playerIndex];
          if (!player) throw new Error("Player not found");
          const blob = await renderCardToBlob(player, parseInt(id));
          dataURL = await blobToDataURL(blob);
        }

        win.document.open();
        win.document.write(openImageInTab(dataURL, `Досье ${id}`));
        win.document.close();

        toast.success("Зажми картинку → Сохранить в Фото");
      } catch (e) {
        console.error(e);
        win.close();
        toast.error("Ошибка генерации изображения");
      } finally {
        setIsSaving(false);
      }
    })();
  }, [id, gameData, isSaving]);

  // "Все карточки" — gallery page in new tab
  const handleSaveAll = useCallback(() => {
    if (!gameData || isSavingAll) return;

    const win = window.open("about:blank", "_blank");
    if (!win) {
      toast.error("Разрешите открытие вкладок в браузере");
      return;
    }

    win.document.write(
      "<html><body style='margin:0;background:#111;color:#4ade80;font-family:monospace;padding:20px'>Генерирую карточки… 0/" +
        gameData.players.length +
        "</body></html>"
    );

    setIsSavingAll(true);
    setProgress(0);

    const players = gameData.players;

    (async () => {
      try {
        const dataURLs: { name: string; url: string }[] = [];

        for (let i = 0; i < players.length; i++) {
          const player = players[i]!;
          setProgress(i + 1);
          win.document.body.textContent = `Генерирую карточки… ${i + 1}/${players.length}`;
          const blob = await renderCardToBlob(player, i + 1);
          const dataURL = await blobToDataURL(blob);
          dataURLs.push({ name: `${i + 1}. ${player.profession}`, url: dataURL });
        }

        const imgs = dataURLs
          .map(
            ({ name, url }) =>
              `<div style="margin-bottom:32px"><p style="color:#4ade80;font-family:monospace;font-size:11px;padding:8px 0;letter-spacing:2px">${name.toUpperCase()}</p>
<img src="${url}" style="max-width:100%;display:block;border-radius:12px"></div>`
          )
          .join("");

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Карточки Бункера</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;padding:16px}</style>
</head><body>${imgs}</body></html>`;

        win.document.open();
        win.document.write(html);
        win.document.close();

        toast.success(`${players.length} карточек готовы — зажми каждую → Сохранить в Фото`);
      } catch (e) {
        console.error(e);
        win.close();
        toast.error("Ошибка генерации");
      } finally {
        setIsSavingAll(false);
        setProgress(0);
      }
    })();
  }, [gameData, isSavingAll]);

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
      const n = parseInt(id) + 1;
      setLocation(n > gameData.players.length ? "/game/hint" : `/game/${n}`);
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
  const busy = isSaving || isSavingAll;

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative">
      <div
        ref={cardRef}
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{ paddingBottom: "9rem" }}
      >
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
      <div
        className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-black/95 backdrop-blur border-t border-white/10 z-40 px-3 pt-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {/* Progress */}
        {isSavingAll && (
          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
        )}

        {/* Arrows */}
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
              disabled={busy}
              variant="ghost"
              size="sm"
              className="flex-1 h-10 text-[11px] text-white/60 hover:text-white border border-white/10 gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              Эту карточку
            </Button>
          )}
          <Button
            onClick={handleSaveAll}
            disabled={busy}
            variant="ghost"
            size="sm"
            className="flex-1 h-10 text-[11px] text-green-400/80 hover:text-green-300 border border-green-900/50 hover:border-green-700/60 gap-1.5"
          >
            {isSavingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {progress}/{total}
              </>
            ) : (
              <>
                <Images className="w-3.5 h-3.5" />
                Все карточки
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
