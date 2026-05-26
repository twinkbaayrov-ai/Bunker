import { Player } from "@workspace/api-client-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { User } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  index: number;
}

export default function PlayerCard({ player, index }: PlayerCardProps) {
  const accent = player.accentColor || "#3b82f6";

  const radarData = [
    { subject: "Выживаемость", A: player.stats.survival, fullMark: 10 },
    { subject: "Социум", A: player.stats.social, fullMark: 10 },
    { subject: "Физ. форма", A: player.stats.physical, fullMark: 10 },
    { subject: "Менталка", A: player.stats.mental, fullMark: 10 },
    { subject: "Полезность", A: player.stats.utility, fullMark: 10 },
  ];

  const Block = ({ title, content, bg }: { title: string; content: string; bg: string }) => (
    <div className={`mb-3 rounded overflow-hidden border border-black/10 shadow-sm`} style={{ backgroundColor: bg }}>
      <div className="px-2 py-1 bg-black/5 text-[10px] font-bold uppercase tracking-widest text-black/60 border-b border-black/5">
        {title}
      </div>
      <div className="p-2 px-3 text-sm font-serif font-medium text-black/90">
        {content}
      </div>
    </div>
  );

  return (
    <div className="paper-card rounded-md shadow-2xl relative min-h-[600px] mb-8 pb-4">
      <div 
        className="absolute top-0 left-0 bottom-0 w-3 rounded-l-md"
        style={{ backgroundColor: accent }}
      />
      
      <div className="absolute top-4 right-4 stamp text-xs border-black/80 text-black/80">
        ДОСЬЕ №{String(index).padStart(3, '0')}
      </div>

      <div className="pt-6 px-6 pb-2 border-b-2 border-black/10 ml-4 mb-4">
        <h1 className="text-3xl font-black uppercase text-black/90 leading-tight">
          {player.profession}
        </h1>
        <p className="text-black/60 italic font-serif text-sm mt-1 mb-2">
          "{player.motto}"
        </p>
      </div>

      <div className="px-6 ml-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Block title="Биометрия" content={`${player.gender}, ${player.age} лет, ${player.orientation}`} bg="#e6e0d4" />
            <Block title="Здоровье" content={player.health} bg="#e8d8d8" />
          </div>
          <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center border-4 border-white/50 shadow-inner">
             <User className="w-12 h-12 text-black/20" />
          </div>
        </div>

        <Block title="Характер" content={player.character} bg="#d8e2e8" />
        <Block title="Хобби" content={player.hobby} bg="#e2e8d8" />
        <Block title="Фобия" content={player.phobia} bg="#e8dbd8" />
        <Block title="Багаж" content={player.baggage} bg="#d8e8dc" />
        <Block title="Знание" content={player.knowledge} bg="#e8e1d8" />
        <Block title="Доп. Инфо" content={player.additionalInfo} bg="#e1d8e8" />

        <div className="my-6 grid grid-cols-2 gap-3">
          <div className="bg-indigo-900/10 border-2 border-indigo-900/20 p-2 rounded rotate-[-1deg]">
            <div className="text-[9px] uppercase font-bold text-indigo-900/50 mb-1">Карта Действия</div>
            <div className="text-sm font-bold text-indigo-900">{player.actionCard}</div>
          </div>
          <div className="bg-rose-900/10 border-2 border-rose-900/20 p-2 rounded rotate-[1deg]">
            <div className="text-[9px] uppercase font-bold text-rose-900/50 mb-1">Карта Состояния</div>
            <div className="text-sm font-bold text-rose-900">{player.conditionCard}</div>
          </div>
        </div>

        <div className="my-4 border border-black/10 bg-white/30 rounded p-2">
           <div className="text-[10px] font-bold text-center uppercase tracking-widest text-black/50 mb-2">Профиль пригодности</div>
           <div className="h-40 w-full -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                <PolarGrid stroke="#000" strokeOpacity={0.1} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#000', fontSize: 9, opacity: 0.6 }} />
                <Radar
                  name="Статы"
                  dataKey="A"
                  stroke={accent}
                  fill={accent}
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-8 border-t-2 border-black/80 pt-4 pb-2 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f4ecd8] px-2 text-[10px] font-black tracking-widest uppercase text-red-700 border border-red-700/50 rounded">
            СЕКРЕТНО
          </div>
          <div className="redacted px-2 py-1 text-sm font-mono text-red-500/80 leading-relaxed min-h-[60px]">
            <span className="text-white/80">{player.secretConnection}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
