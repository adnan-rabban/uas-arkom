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
    <div className="space-y-2.5">
      <span className="ios-label flex items-center gap-2">
        <Map className="w-4 h-4 text-[#0A84FF]" />
        {t.mapPreset}
      </span>
      <Select
        value={currentPreset}
        onValueChange={(val) => {
          if (val) onSelectPreset(val);
        }}
      >
        <SelectTrigger className="h-9 w-full text-[12px] font-medium tracking-wide glass-input text-white/70 hover:text-white rounded-xl">
          <SelectValue placeholder={t.mapPreset} />
        </SelectTrigger>
        <SelectContent className="bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/8ded-xl">
          {presets.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-[12px] font-medium tracking-wide text-white/60 focus:bg-white/8 focus:text-white rounded-lg">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
