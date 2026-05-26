import { GameData, useReshuffleArchetypes } from "@workspace/api-client-react";
import { AlertTriangle, Shield, Clock, Users, MapPin, RefreshCw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export default function CardZero({ gameData, setGameData }: { gameData: GameData, setGameData: (data: GameData) => void }) {
  const reshuffle = useReshuffleArchetypes();

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

  return (
    <div className="space-y-6 pb-6">
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
              <RefreshCw className={`mr-2 h-4 w-4 ${reshuffle.isPending ? 'animate-spin' : ''}`} />
              Перемешать персонажей
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <div className="bg-red-950/20 border border-red-900 rounded-lg p-5 relative overflow-hidden">
        <div className="absolute top-2 right-2 stamp text-xs opacity-70">
          УГРОЗА
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-900 p-2 rounded">
            <AlertTriangle className="text-red-500 h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-red-500 uppercase tracking-widest">{apocalypse.title}</h2>
        </div>

        <p className="text-red-100 text-sm mb-6 leading-relaxed">
          {apocalypse.description}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 p-3 border border-red-900/50 rounded">
            <div className="text-[10px] text-red-500/70 uppercase mb-1">Уровень угрозы</div>
            <div className="font-bold text-red-400 text-sm">{apocalypse.threatLevel}</div>
          </div>
          <div className="bg-black/40 p-3 border border-red-900/50 rounded">
            <div className="text-[10px] text-red-500/70 uppercase mb-1">До удара</div>
            <div className="font-bold text-red-400 text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" /> {apocalypse.timeToImpact}
            </div>
          </div>
          <div className="bg-black/40 p-3 border border-red-900/50 rounded col-span-2">
            <div className="text-[10px] text-red-500/70 uppercase mb-1">Остаток населения</div>
            <div className="font-bold text-red-400 text-sm flex items-center gap-1">
              <Users className="h-3 w-3" /> {apocalypse.survivors}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-950/10 border border-blue-900/50 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-6 border-b border-blue-900/50 pb-4">
          <div className="bg-blue-900/50 p-2 rounded">
            <Shield className="text-blue-400 h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-400 uppercase tracking-wider">{bunker.name}</h2>
            <div className="text-xs text-blue-400/60 flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" /> {bunker.location}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 text-center bg-blue-950/30 p-2 rounded border border-blue-900/30">
            <div className="text-[10px] text-blue-400/60 uppercase">Вместимость</div>
            <div className="font-bold text-blue-300">{bunker.capacity} чел</div>
          </div>
          <div className="flex-1 text-center bg-blue-950/30 p-2 rounded border border-blue-900/30">
            <div className="text-[10px] text-blue-400/60 uppercase">Площадь</div>
            <div className="font-bold text-blue-300">{bunker.area}</div>
          </div>
          <div className="flex-1 text-center bg-blue-950/30 p-2 rounded border border-blue-900/30">
            <div className="text-[10px] text-blue-400/60 uppercase">Время</div>
            <div className="font-bold text-blue-300">{bunker.duration}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-blue-500 uppercase mb-2">Отсеки</h3>
            <div className="space-y-2">
              {bunker.rooms.map((room, i) => (
                <div key={i} className="bg-black/40 p-2 text-sm border border-blue-900/30 rounded flex justify-between items-center">
                  <span className="text-blue-100">{room.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">{room.description}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      room.status === 'operational' ? 'bg-green-500' :
                      room.status === 'damaged' ? 'bg-yellow-500' :
                      room.status === 'critical' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-500 uppercase mb-2">Запасы</h3>
            <div className="flex flex-wrap gap-2">
              {bunker.resources.map((res, i) => (
                <div key={i} className="text-xs bg-blue-950/50 text-blue-200 px-2 py-1 rounded border border-blue-900/50">
                  {res.name}: <span className="font-bold">{res.amount} {res.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-sm text-blue-200">
            <span className="font-bold uppercase text-blue-400 mr-2">Особенность:</span>
            {bunker.specialFeature}
          </div>
        </div>
      </div>
    </div>
  );
}
