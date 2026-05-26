import { useState, useRef } from "react";
import { GameData, Player } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Eye, Plus, Camera } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface HintCardProps {
  gameData: GameData;
}

type CharacteristicKey = keyof Omit<Player, "id" | "stats" | "accentColor" | "secretConnection" | "motto" | "profession">;

const CHAR_LABELS: Record<CharacteristicKey, string> = {
  gender: "Пол",
  age: "Возраст",
  orientation: "Ориентация",
  health: "Здоровье",
  hobby: "Хобби",
  phobia: "Фобия",
  character: "Характер",
  additionalInfo: "Доп. инфо",
  knowledge: "Знания",
  baggage: "Багаж",
  actionCard: "Карта действия",
  conditionCard: "Карта состояния",
};

export default function HintCard({ gameData }: HintCardProps) {
  const [isEditMode, setIsEditMode] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, CharacteristicKey[]>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  const toggleReveal = (playerId: number, char: CharacteristicKey) => {
    setRevealed((prev) => {
      const playerChars = prev[playerId] || [];
      return playerChars.includes(char)
        ? { ...prev, [playerId]: playerChars.filter((c) => c !== char) }
        : { ...prev, [playerId]: [...playerChars, char] };
    });
  };

  const clearAll = () => setRevealed({});

  const handleSaveCard = async () => {
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
      link.download = "bunker-hint.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Подсказка сохранена");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  if (isEditMode) {
    return (
      <div className="space-y-4 pb-12">
        <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
          <h2 className="font-bold uppercase text-zinc-300 text-sm">Управление столом</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-zinc-500 h-8">
              Сбросить
            </Button>
            <Button size="sm" onClick={() => setIsEditMode(false)}
              className="bg-primary hover:bg-primary/90 text-xs h-8 gap-1">
              <Eye className="w-3 h-3" />
              Карточка
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {gameData.players.map((p, idx) => (
            <div key={p.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-sm flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.accentColor }}
                  />
                  <span className="text-zinc-500 text-xs">#{idx + 1}</span>
                  <span className="text-zinc-200">{p.profession}</span>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-zinc-900 border-zinc-700 gap-1">
                      <Plus className="w-3 h-3" />
                      Вскрыть
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-zinc-900 border-zinc-800 p-2" align="end">
                    <div className="text-[10px] font-bold uppercase text-zinc-500 mb-2 px-1">Вскрытые характеристики</div>
                    <div className="space-y-1.5">
                      {(Object.keys(CHAR_LABELS) as CharacteristicKey[]).map((char) => (
                        <div key={char} className="flex items-center space-x-2">
                          <Checkbox
                            id={`char-${p.id}-${char}`}
                            checked={(revealed[p.id] || []).includes(char)}
                            onCheckedChange={() => toggleReveal(p.id, char)}
                            className="border-zinc-700 data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor={`char-${p.id}-${char}`}
                            className="text-sm text-zinc-300 cursor-pointer"
                          >
                            {CHAR_LABELS[char]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(revealed[p.id] || []).map((char) => (
                  <div
                    key={char}
                    className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${p.accentColor}15`,
                      borderColor: `${p.accentColor}40`,
                      color: p.accentColor,
                    }}
                  >
                    <span className="opacity-60 mr-1">{CHAR_LABELS[char]}:</span>
                    <span className="font-bold truncate">{String(p[char])}</span>
                  </div>
                ))}
                {!(revealed[p.id] || []).length && (
                  <div className="text-xs text-zinc-600 italic">Ничего не вскрыто</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasAnyRevealed = Object.values(revealed).some((r) => r && r.length > 0);

  return (
    <div className="space-y-3 pb-12">
      {/* Toolbar */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsEditMode(true)}
          className="flex-1 bg-zinc-900/50 border border-zinc-800 text-white/60 hover:text-white gap-1.5 h-8 text-xs">
          <Edit2 className="w-3 h-3" />
          Редактировать
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSaveCard}
          className="flex-1 bg-zinc-900/50 border border-zinc-800 text-green-400/70 hover:text-green-300 gap-1.5 h-8 text-xs">
          <Camera className="w-3 h-3" />
          Сохранить фото
        </Button>
      </div>

      {/* Card to screenshot */}
      <div ref={cardRef} className="bg-black border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 px-5 py-4 border-b border-white/10">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Сводка ведущего</div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">{gameData.bunker.name}</h2>
          <div className="text-xs text-white/40 mt-0.5">
            {gameData.players.length} игроков • {gameData.bunker.capacity} мест
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {hasAnyRevealed ? (
            gameData.players.map((p, idx) => {
              const r = revealed[p.id] || [];
              if (r.length === 0) return null;
              return (
                <div
                  key={p.id}
                  className="rounded-xl overflow-hidden border"
                  style={{ borderColor: `${p.accentColor}33` }}
                >
                  <div
                    className="px-3 py-2 flex items-center gap-2"
                    style={{ backgroundColor: `${p.accentColor}20` }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                      style={{ backgroundColor: p.accentColor }}
                    >
                      {idx + 1}
                    </div>
                    <span className="font-bold text-sm text-white/90">{p.profession}</span>
                  </div>
                  <div className="px-3 py-2 space-y-1.5 bg-black/20">
                    {r.map((char) => (
                      <div key={char} className="flex gap-2 text-xs">
                        <span className="text-white/35 shrink-0">{CHAR_LABELS[char]}:</span>
                        <span className="text-white/85 font-medium">{String(p[char])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-white/25 text-sm py-10 italic">
              Характеристики ещё не вскрыты
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
          <div className="text-[9px] text-white/20 uppercase tracking-widest">Бункер</div>
          <div className="text-[9px] text-white/20">{gameData.apocalypse.title}</div>
        </div>
      </div>
    </div>
  );
}
