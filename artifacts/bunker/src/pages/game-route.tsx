import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { GameData } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import CardZero from "./card-zero";
import PlayerCard from "./player-card";
import HintCard from "./hint-card";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

interface GameRouteProps {
  id: string;
  gameData: GameData | null;
  setGameData: (data: GameData) => void;
}

export default function GameRoute({ id, gameData, setGameData }: GameRouteProps) {
  const [, setLocation] = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameData) {
      setLocation("/");
    }
  }, [gameData, setLocation]);

  const handleSave = useCallback(async () => {
    const el = cardRef.current;
    if (!el) return;

    try {
      const canvas = await html2canvas(el, {
        backgroundColor: "#000000",
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
      console.error("Ошибка сохранения", e);
    }
  }, [id]);

  if (!gameData) return null;

  const handlePrev = () => {
    if (id === "hint") {
      setLocation(`/game/${gameData.players.length}`);
    } else if (id === "1") {
      setLocation(`/game/0`);
    } else if (id !== "0") {
      setLocation(`/game/${parseInt(id) - 1}`);
    } else {
      setLocation("/");
    }
  };

  const handleNext = () => {
    if (id === "0") {
      setLocation("/game/1");
    } else if (id !== "hint") {
      const nextId = parseInt(id) + 1;
      if (nextId > gameData.players.length) {
        setLocation("/game/hint");
      } else {
        setLocation(`/game/${nextId}`);
      }
    }
  };

  const renderCard = () => {
    if (id === "0") return <CardZero gameData={gameData} setGameData={setGameData} />;
    if (id === "hint") return <HintCard gameData={gameData} />;

    const playerIndex = parseInt(id) - 1;
    const player = gameData.players[playerIndex];

    if (player) {
      return <PlayerCard player={player} index={playerIndex + 1} />;
    }

    return null;
  };

  const canSave = id !== "hint";

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative">
      <div ref={cardRef} className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={id}
            initial={{ y: 20, opacity: 0, rotate: -2 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 2 }}
            transition={{ duration: 0.3 }}
            className="min-h-full p-4"
          >
            {renderCard()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-black/90 backdrop-blur border-t border-white/10 p-4 flex justify-between items-center z-40">
        <Button variant="outline" onClick={handlePrev} className="bg-transparent border-white/20 text-white hover:bg-white/10">
          <ChevronLeft className="mr-2 h-4 w-4" /> Назад
        </Button>

        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-white/50 font-mono">
            {id === "0" ? "БАЗА" : id === "hint" ? "ПОДСКАЗКА" : `ДОСЬЕ ${id}/${gameData.players.length}`}
          </div>
          {canSave && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="h-6 text-[10px] text-white/40 hover:text-white/80 px-2 gap-1"
            >
              <Camera className="w-3 h-3" />
              Сохранить фото
            </Button>
          )}
        </div>

        <Button variant="outline" onClick={handleNext} disabled={id === "hint"} className="bg-transparent border-white/20 text-white hover:bg-white/10">
          Далее <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
