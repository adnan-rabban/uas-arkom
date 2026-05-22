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
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1c69d4] flex items-center gap-1.5">
        <Map className="w-3 h-3" />
        {t.mapPreset}
      </span>
      <Select
        value={currentPreset}
        onValueChange={(val) => {
          if (val) onSelectPreset(val);
        }}
      >
        <SelectTrigger className="h-8 w-full text-[10px] font-mono tracking-wider bg-[#0d0d0d] border-[#3c3c3c] text-white/60 hover:text-white hover:border-white/50 rounded-none">
          <SelectValue placeholder={t.mapPreset} />
        </SelectTrigger>
        <SelectContent className="bg-[#1a1a1a] border-[#3c3c3c] rounded-none">
          {presets.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-[10px] font-mono tracking-wider text-white/60 focus:bg-white/10 focus:text-white rounded-none">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
