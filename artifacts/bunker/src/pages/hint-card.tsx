import { useState } from "react";
import { GameData, Player } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Eye, Plus } from "lucide-react";

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
  conditionCard: "Карта состояния"
};

export default function HintCard({ gameData }: HintCardProps) {
  const [isEditMode, setIsEditMode] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, CharacteristicKey[]>>({});

  const toggleReveal = (playerId: number, char: CharacteristicKey) => {
    setRevealed(prev => {
      const playerChars = prev[playerId] || [];
      if (playerChars.includes(char)) {
        return { ...prev, [playerId]: playerChars.filter(c => c !== char) };
      } else {
        return { ...prev, [playerId]: [...playerChars, char] };
      }
    });
  };

  const clearAll = () => setRevealed({});

  if (isEditMode) {
    return (
      <div className="space-y-4 pb-12">
        <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded border border-zinc-800">
          <h2 className="font-bold uppercase text-zinc-300 text-sm">Управление столом</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-zinc-500">
              Сбросить
            </Button>
            <Button size="sm" onClick={() => setIsEditMode(false)} className="bg-primary hover:bg-primary/90 text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Карточка
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {gameData.players.map((p, idx) => (
            <div key={p.id} className="bg-zinc-950 border border-zinc-800 rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-sm text-zinc-200">
                  <span className="text-zinc-500 mr-2">#{idx + 1}</span>
                  {p.profession}
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-zinc-900 border-zinc-700">
                      <Plus className="w-3 h-3 mr-1" />
                      Добавить
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-zinc-900 border-zinc-800 p-2" align="end">
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase text-zinc-500 mb-2">Вскрытые карты</div>
                      {(Object.keys(CHAR_LABELS) as CharacteristicKey[]).map(char => (
                        <div key={char} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`char-${p.id}-${char}`}
                            checked={(revealed[p.id] || []).includes(char)}
                            onCheckedChange={() => toggleReveal(p.id, char)}
                            className="border-zinc-700 data-[state=checked]:bg-primary"
                          />
                          <label 
                            htmlFor={`char-${p.id}-${char}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300"
                          >
                            {CHAR_LABELS[char]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {(revealed[p.id] || []).map(char => (
                  <div key={char} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700 flex items-center gap-1">
                    <span className="text-zinc-500">{CHAR_LABELS[char]}:</span>
                    <span className="font-bold truncate max-w-[120px]" title={String(p[char])}>
                      {p[char]}
                    </span>
                  </div>
                ))}
                {!(revealed[p.id] || []).length && (
                  <div className="text-xs text-zinc-600 italic">Пока ничего не вскрыто</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 relative">
      <div className="absolute top-0 right-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)} className="bg-black/50 hover:bg-black text-white/50 hover:text-white rounded-full">
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-black border-2 border-white/10 p-5 rounded-lg">
        <div className="text-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-1 text-white/90">Сводка стола</h2>
          <p className="text-xs text-white/50">{gameData.bunker.name} • {gameData.bunker.capacity} мест</p>
        </div>

        <div className="space-y-4">
          {gameData.players.map((p, idx) => {
            const r = revealed[p.id] || [];
            if (r.length === 0) return null;

            return (
              <div key={p.id} className="border-l-2 pl-3 py-1" style={{ borderColor: p.accentColor || '#fff' }}>
                <div className="font-bold text-sm text-white/90 mb-1.5">
                  <span className="opacity-50 mr-1">#{idx + 1}</span>
                  {p.profession}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.map(char => (
                    <div key={char} className="text-[10px] bg-white/5 text-white/80 px-2 py-0.5 rounded border border-white/10">
                      <span className="opacity-50 mr-1">{CHAR_LABELS[char]}:</span>
                      <span className="font-bold">{p[char]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {Object.values(revealed).every(r => !r || r.length === 0) && (
            <div className="text-center text-white/30 text-sm py-8 italic">
              Характеристики еще не вскрыты
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
