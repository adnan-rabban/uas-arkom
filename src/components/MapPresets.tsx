import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <span className="ios-label">
        {t.mapPreset}
      </span>
      <Select
        value={currentPreset}
        onValueChange={(val) => {
          if (val) onSelectPreset(val);
        }}
      >
        <SelectTrigger className="h-9 w-full text-[12px] font-medium tracking-[-0.01em] glass-input text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer">
          <SelectValue placeholder={t.mapPreset} />
        </SelectTrigger>
        <SelectContent className="bg-white/92 backdrop-blur-[50px] saturate-180 border border-black/8 rounded-xl">
          {presets.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-[12px] font-medium tracking-[-0.01em] text-slate-600 focus:bg-black/5 focus:text-slate-800 rounded-lg cursor-pointer">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
