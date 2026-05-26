import { useState } from "react";
import { GameData, Player, useReshuffleArchetypes } from "@workspace/api-client-react";
import { AlertTriangle, Shield, Clock, Users, MapPin, RefreshCw, Settings2, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

type RoomStatus = "operational" | "damaged" | "critical" | "destroyed";

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; bg: string; next: RoomStatus }> = {
  operational: { label: "Работает", color: "#22c55e", bg: "#052e16", next: "damaged" },
  damaged:     { label: "Повреждена", color: "#facc15", bg: "#1a1200", next: "critical" },
  critical:    { label: "Критично", color: "#f97316", bg: "#1a0800", next: "destroyed" },
  destroyed:   { label: "Разрушена", color: "#ef4444", bg: "#1a0000", next: "operational" },
};

const REPAIR_KEYWORDS: Record<string, string[]> = {
  "мед": ["врач", "хирург", "медсестр", "фельдшер", "педиатр", "терапевт", "психиатр", "психолог", "медик", "санитар"],
  "генератор": ["электрик", "инженер", "техник", "механик", "энергетик"],
  "вода": ["сантехник", "инженер", "химик", "гидролог", "эколог"],
  "питани": ["повар", "диетолог", "агроном", "технолог"],
  "связь": ["связист", "программист", "хакер", "it", "техник", "радист"],
  "оружи": ["военный", "солдат", "офицер", "охранник", "полицейский", "снайпер"],
  "склад": ["логист", "кладовщик", "менеджер", "администратор"],
  "лабор": ["химик", "биолог", "физик", "учёный", "исследователь"],
  "вентил": ["инженер", "техник", "механик"],
  "электр": ["электрик", "инженер", "техник"],
};

function findRepairers(roomName: string, players: Player[]): Player[] {
  const roomLower = roomName.toLowerCase();
  let keywords: string[] = [];

  for (const [key, kws] of Object.entries(REPAIR_KEYWORDS)) {
    if (roomLower.includes(key)) {
      keywords = kws;
      break;
    }
  }

  if (keywords.length === 0) {
    keywords = ["инженер", "техник", "механик"];
  }

  return players.filter(p => {
    const search = `${p.profession} ${p.knowledge}`.toLowerCase();
    return keywords.some(kw => search.includes(kw));
  });
}

interface RoomWithStatus {
  name: string;
  status: RoomStatus;
  description: string;
}

export default function CardZero({
  gameData,
  setGameData,
}: {
  gameData: GameData;
  setGameData: (data: GameData) => void;
}) {
  const reshuffle = useReshuffleArchetypes();
  const [rooms, setRooms] = useState<RoomWithStatus[]>(
    gameData.bunker.rooms.map(r => ({ ...r, status: r.status as RoomStatus }))
  );
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [showResources, setShowResources] = useState(false);

  const cycleStatus = (idx: number) => {
    setRooms(prev => {
      const next = [...prev];
      const cur = next[idx]!;
      next[idx] = { ...cur, status: STATUS_CONFIG[cur.status].next };
      return next;
    });
  };

  const handleReshuffle = () => {
    reshuffle.mutate(
      { data: { players: gameData.players } },
      {
        onSuccess: (result) => {
          setGameData({ ...gameData, players: result.players });
          toast.success("Персонажи перемешаны");
        },
      }
    );
  };

  const { apocalypse, bunker } = gameData;

  const operationalCount = rooms.filter(r => r.status === "operational").length;
  const totalRooms = rooms.length;

  return (
    <div className="space-y-4 pb-24">
      {/* Tools */}
      <div className="flex justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
              <Settings2 className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 bg-black border-white/20 p-2" align="end">
            <Button
              onClick={handleReshuffle}
              disabled={reshuffle.isPending}
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${reshuffle.isPending ? "animate-spin" : ""}`} />
              Перемешать персонажей
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Apocalypse block */}
      <div className="bg-red-950/20 border border-red-900 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-3 right-3 text-[9px] font-black border border-red-700 text-red-600 px-2 py-0.5 rounded rotate-[-3deg] uppercase tracking-wider">
          Угроза
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-red-900/60 p-2 rounded-xl">
            <AlertTriangle className="text-red-400 h-5 w-5" />
          </div>
          <h2 className="text-lg font-black text-red-400 uppercase tracking-wider leading-tight">{apocalypse.title}</h2>
        </div>
        <p className="text-red-100/80 text-sm mb-4 leading-relaxed">{apocalypse.description}</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Угроза", value: apocalypse.threatLevel },
            { label: "До удара", value: apocalypse.timeToImpact },
            { label: "Выжившие", value: apocalypse.survivors },
          ].map(item => (
            <div key={item.label} className="bg-black/40 p-2 border border-red-900/40 rounded-xl text-center">
              <div className="text-[9px] text-red-500/60 uppercase mb-0.5">{item.label}</div>
              <div className="font-bold text-red-300 text-[10px] leading-tight">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bunker header */}
      <div className="bg-blue-950/10 border border-blue-900/50 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-blue-900/30 flex items-center gap-3">
          <div className="bg-blue-900/50 p-2 rounded-xl">
            <Shield className="text-blue-400 h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-blue-300 uppercase tracking-wider">{bunker.name}</h2>
            <div className="text-xs text-blue-400/50 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {bunker.location}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-blue-900/30">
          {[
            { icon: <Users className="h-3 w-3" />, label: "Мест", value: bunker.capacity },
            { icon: <Clock className="h-3 w-3" />, label: "Срок", value: bunker.duration },
            { icon: <MapPin className="h-3 w-3" />, label: "Площадь", value: bunker.area },
          ].map(item => (
            <div key={item.label} className="p-3 text-center">
              <div className="flex justify-center text-blue-400/50 mb-1">{item.icon}</div>
              <div className="text-[9px] text-blue-400/50 uppercase">{item.label}</div>
              <div className="font-bold text-blue-200 text-xs leading-tight">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bunker status overview */}
      <div className="flex items-center justify-between px-1">
        <div className="text-sm font-bold text-white/70 uppercase tracking-wide flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Отсеки бункера
        </div>
        <div className="text-xs text-white/40">
          {operationalCount}/{totalRooms} работают
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(operationalCount / totalRooms) * 100}%`,
            backgroundColor: operationalCount === totalRooms ? "#22c55e" : operationalCount > totalRooms / 2 ? "#facc15" : "#ef4444",
          }}
        />
      </div>

      {/* Rooms interactive list */}
      <div className="space-y-2">
        {rooms.map((room, idx) => {
          const cfg = STATUS_CONFIG[room.status];
          const repairers = room.status !== "operational" ? findRepairers(room.name, gameData.players) : [];
          const isExpanded = expandedRoom === idx;

          return (
            <div
              key={idx}
              className="rounded-xl border overflow-hidden transition-all"
              style={{ borderColor: `${cfg.color}33`, backgroundColor: `${cfg.bg}` }}
            >
              <div
                className="flex items-center gap-3 p-3 cursor-pointer select-none"
                onClick={() => setExpandedRoom(isExpanded ? null : idx)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); cycleStatus(idx); }}
                  className="w-3 h-3 rounded-full flex-shrink-0 border-2 transition-colors"
                  style={{ backgroundColor: cfg.color, borderColor: cfg.color }}
                  title="Нажми чтобы изменить статус"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white/90 text-sm font-semibold truncate">{room.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-[9px] font-bold uppercase" style={{ color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3 text-white/30" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-white/30" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                  <p className="text-white/50 text-xs">{room.description}</p>

                  {room.status !== "operational" && (
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5 flex items-center gap-1">
                        <Wrench className="h-2.5 w-2.5" /> Может починить
                      </div>
                      {repairers.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {repairers.map(p => (
                            <div
                              key={p.id}
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: `${p.accentColor}22`, color: p.accentColor, border: `1px solid ${p.accentColor}44` }}
                            >
                              #{p.id} {p.profession}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-red-400/60 text-[10px] italic">Нет подходящих игроков</div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => cycleStatus(idx)}
                    className="w-full text-center text-[9px] font-bold uppercase tracking-widest py-1.5 rounded-lg transition-colors"
                    style={{ color: cfg.color, border: `1px solid ${cfg.color}33`, backgroundColor: `${cfg.color}11` }}
                  >
                    Изменить статус → {STATUS_CONFIG[cfg.next].label}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resources collapsible */}
      <button
        onClick={() => setShowResources(!showResources)}
        className="w-full flex items-center justify-between px-1 py-2"
      >
        <div className="text-sm font-bold text-white/70 uppercase tracking-wide">Запасы бункера</div>
        {showResources ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
      </button>

      {showResources && (
        <div className="flex flex-wrap gap-2">
          {bunker.resources.map((res, i) => (
            <div key={i} className="text-xs bg-blue-950/40 text-blue-200 px-3 py-1.5 rounded-full border border-blue-900/40">
              {res.name}: <span className="font-bold">{res.amount} {res.unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* Special feature */}
      <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl text-sm text-blue-200 leading-relaxed">
        <span className="font-bold text-blue-400 text-[10px] uppercase tracking-widest block mb-1">Особенность</span>
        {bunker.specialFeature}
      </div>
    </div>
  );
}
