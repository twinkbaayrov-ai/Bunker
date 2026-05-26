import { Player } from "@workspace/api-client-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

interface PlayerCardProps {
  player: Player;
  index: number;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 80, g: 80, b: 200 };
  return { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
}

export default function PlayerCard({ player, index }: PlayerCardProps) {
  const accent = player.accentColor || "#3b82f6";
  const rgb = hexToRgb(accent);
  const accentDark = `rgb(${Math.max(0, rgb.r - 50)}, ${Math.max(0, rgb.g - 50)}, ${Math.max(0, rgb.b - 50)})`;

  const radarData = [
    { subject: "Выжив.", A: player.stats.survival },
    { subject: "Социум", A: player.stats.social },
    { subject: "Физ.", A: player.stats.physical },
    { subject: "Психика", A: player.stats.mental },
    { subject: "Польза", A: player.stats.utility },
  ];

  const traits = [
    { label: "Здоровье", value: player.health, emoji: "🩺" },
    { label: "Хобби", value: player.hobby, emoji: "🎯" },
    { label: "Фобия", value: player.phobia, emoji: "😨" },
    { label: "Характер", value: player.character, emoji: "🧠" },
    { label: "Факт", value: player.additionalInfo, emoji: "📌" },
    { label: "Знание", value: player.knowledge, emoji: "📚" },
    { label: "Багаж", value: player.baggage, emoji: "🎒" },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl mb-6"
      style={{ fontFamily: "'Space Mono', monospace", backgroundColor: "#0d0d0d", border: `2px solid ${accent}33` }}
    >
      {/* Header */}
      <div
        className="relative px-5 pt-5 pb-4"
        style={{ background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 100%)` }}
      >
        <div className="flex justify-between items-start">
          <div
            className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded"
            style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.85)" }}
          >
            ДОСЬЕ #{String(index).padStart(3, "0")}
          </div>
          <div className="flex gap-1">
            {[player.stats.survival, player.stats.social, player.stats.physical].map((s, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black"
                style={{ backgroundColor: "rgba(0,0,0,0.35)", color: "white" }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        <h1 className="text-2xl font-black text-white mt-3 leading-tight uppercase tracking-wide">
          {player.profession}
        </h1>
        <p className="text-white/70 text-xs mt-1 italic" style={{ fontFamily: "'Playfair Display', serif" }}>
          "{player.motto}"
        </p>
        <div className="flex gap-3 mt-3 text-xs text-white/80">
          <span>{player.gender}</span>
          <span>•</span>
          <span>{player.age} лет</span>
          <span>•</span>
          <span>{player.orientation}</span>
        </div>
      </div>

      {/* Traits */}
      <div className="px-4 pt-4 grid grid-cols-1 gap-2">
        {traits.map((t) => (
          <div key={t.label} className="flex gap-2 items-start">
            <div className="text-base leading-none mt-0.5">{t.emoji}</div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-widest mr-2" style={{ color: accent }}>
                {t.label}
              </span>
              <span className="text-white/85 text-[11px] leading-tight">{t.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Radar chart — fixed size for reliable html2canvas capture */}
      <div className="px-4 pt-4">
        <div className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1 text-center">
          Профиль пригодности
        </div>
        <div className="flex justify-center">
          <RadarChart width={340} height={160} cx={170} cy={80} outerRadius={58} data={radarData}>
            <PolarGrid stroke="#ffffff12" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#ffffff55", fontSize: 9 }} />
            <Radar dataKey="A" stroke={accent} fill={accent} fillOpacity={0.25} />
          </RadarChart>
        </div>
      </div>

      {/* Action + Condition cards */}
      <div className="px-4 pt-2 pb-4 grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3"
          style={{ background: "linear-gradient(135deg, #1a1040, #2d1b6e)", border: "1px solid #7c3aed55" }}
        >
          <div className="text-[8px] font-black uppercase tracking-widest text-purple-400 mb-1.5">
            ⚡ Карта Действия
          </div>
          <div className="text-white text-[10px] leading-relaxed font-medium">{player.actionCard}</div>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ background: "linear-gradient(135deg, #1a0a0a, #6e1b1b)", border: "1px solid #dc262655" }}
        >
          <div className="text-[8px] font-black uppercase tracking-widest text-red-400 mb-1.5">
            🔮 Карта Состояния
          </div>
          <div className="text-white text-[10px] leading-relaxed font-medium">{player.conditionCard}</div>
        </div>
      </div>

      {/* Secret */}
      <div className="mx-4 mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #dc262633" }}>
        <div className="bg-red-950/40 px-3 py-1.5">
          <div className="text-[8px] font-black uppercase tracking-widest text-red-500">🔒 Секретная связь</div>
        </div>
        <div className="px-3 py-2 bg-black/40">
          <div className="text-white/75 text-[11px] leading-relaxed">{player.secretConnection}</div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accentDark}, ${accent})` }} />
    </div>
  );
}
