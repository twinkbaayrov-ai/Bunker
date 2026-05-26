import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGenerateGame, GameData } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Terminal, AlertTriangle } from "lucide-react";

interface HomeProps {
  gameData: GameData | null;
  setGameData: (data: GameData) => void;
}

const APOCALYPSE_TYPES = [
  { id: "ai_uprising", label: "ИИ восстал" },
  { id: "nuclear_war", label: "Ядерная война" },
  { id: "virus_zombie", label: "Вирус/Зомби" },
  { id: "natural_anomaly", label: "Природная аномалия" },
  { id: "experiment", label: "Эксперимент" },
];

export default function Home({ gameData, setGameData }: HomeProps) {
  const [, setLocation] = useLocation();
  const [apocalypseType, setApocalypseType] = useState<string>("nuclear_war");
  const [playerCount, setPlayerCount] = useState<number>(6);
  
  const generateGame = useGenerateGame();

  const handleGenerate = () => {
    generateGame.mutate(
      { data: { apocalypseType: apocalypseType as any, playerCount } },
      {
        onSuccess: (data) => {
          setGameData(data);
          setLocation("/game/0");
        },
      }
    );
  };

  if (generateGame.isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-black relative overflow-hidden">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-red-950/20"
        />
        <Loader2 className="h-16 w-16 animate-spin text-red-500" />
        <h2 className="text-2xl font-bold tracking-widest text-red-500 uppercase">
          ГЕНЕРАЦИЯ ДАННЫХ...
        </h2>
        <div className="space-y-2 text-red-400/80 text-sm font-mono text-left w-full max-w-xs bg-black/50 p-4 border border-red-900/50 rounded">
          <p>{`> Инициализация протокола выживания...`}</p>
          <p>{`> Подбор кандидатов (${playerCount})...`}</p>
          <p>{`> Анализ бункера...`}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {`> Шифрование досье...`}
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black text-green-500 font-mono p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-green-900/50">
        <Terminal className="h-8 w-8" />
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider">Терминал X-7</h1>
          <p className="text-xs text-green-700">Уровень доступа: Администратор</p>
        </div>
      </div>

      <div className="space-y-8 flex-1">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-red-500 font-bold uppercase border-l-2 border-red-500 pl-2">
            <AlertTriangle className="h-5 w-5" />
            <h2>Тип угрозы</h2>
          </div>
          
          <RadioGroup
            value={apocalypseType}
            onValueChange={setApocalypseType}
            className="gap-3"
          >
            {APOCALYPSE_TYPES.map((type) => (
              <div key={type.id} className="flex items-center space-x-3">
                <RadioGroupItem value={type.id} id={type.id} className="border-green-700 text-green-500" />
                <Label htmlFor={type.id} className="text-green-400 uppercase tracking-wide cursor-pointer">
                  {type.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between border-l-2 border-green-500 pl-2">
            <h2 className="font-bold uppercase text-green-500">Количество выживших</h2>
            <span className="text-2xl font-bold bg-green-950/50 px-3 py-1 rounded text-green-400">
              {playerCount}
            </span>
          </div>
          
          <Slider
            value={[playerCount]}
            onValueChange={(v) => setPlayerCount(v[0])}
            min={5}
            max={11}
            step={1}
            className="py-4"
          />
        </section>
      </div>

      <div className="pt-8 mt-auto">
        <Button
          onClick={handleGenerate}
          size="lg"
          className="w-full bg-red-900 hover:bg-red-800 text-white font-bold tracking-widest uppercase h-14 border border-red-500"
        >
          Сгенерировать игру
        </Button>
        {gameData && (
          <Button
            onClick={() => setLocation("/game/0")}
            variant="ghost"
            className="w-full mt-4 text-green-600 hover:text-green-400"
          >
            Продолжить текущую игру
          </Button>
        )}
      </div>
    </div>
  );
}
