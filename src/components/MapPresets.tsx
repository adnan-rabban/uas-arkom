import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Map } from 'lucide-react';
import type { Language } from '@/types';
import { translations } from '@/lib/constants';

interface MapPresetsProps {
  currentPreset: string;
  onSelectPreset: (id: string) => void;
  lang: Language;
}

export function MapPresets({ currentPreset, onSelectPreset, lang }: MapPresetsProps) {
  const t = translations[lang];

  const presets = [
    { id: 'default', label: t.presetDefault },
    { id: 'maze', label: t.presetMaze },
    { id: 'openField', label: t.presetOpenField },
    { id: 'bottleneck', label: t.presetBottleneck },
    { id: 'empty', label: t.presetEmpty },
  ];

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-sky-400/50 flex items-center gap-1.5">
        <Map className="w-3 h-3" />
        {t.mapPreset}
      </span>
      <Select
        value={currentPreset}
        onValueChange={(val) => {
          if (val) onSelectPreset(val);
        }}
      >
        <SelectTrigger className="h-8 w-full text-[10px] font-mono tracking-wider bg-white/2 border-white/5 text-white/40 hover:text-white/60">
          <SelectValue placeholder={t.mapPreset} />
        </SelectTrigger>
        <SelectContent className="bg-[#0c1424] border-white/10">
          {presets.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-[10px] font-mono tracking-wider text-white/50 focus:bg-sky-500/10 focus:text-sky-300">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
