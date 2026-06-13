import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Zap, Route, Layers } from 'lucide-react';
import { useState } from 'react';
import type { AlgorithmKey, Language } from '@/types';
import { translations } from '@/lib/constants';

interface AlgorithmSelectorProps {
  algorithm: AlgorithmKey;
  onSelect: (algo: AlgorithmKey) => void;
  onCompareAll: () => void;
  lang: Language;
}

export function AlgorithmSelector({ algorithm, onSelect, onCompareAll, lang }: AlgorithmSelectorProps) {
  const t = translations[lang];
  const [infoOpen, setInfoOpen] = useState(false);

  const algos: { key: AlgorithmKey; label: string; icon: React.ReactNode }[] = [
    { key: 'astar', label: 'A*', icon: <Zap className="w-3 h-3" /> },
    { key: 'dijkstra', label: 'Dijkstra', icon: <Route className="w-3 h-3" /> },
    { key: 'bfs', label: 'BFS', icon: <Layers className="w-3 h-3" /> },
  ];

  const infoMap: Record<AlgorithmKey, { name: string; desc: string; color: string }> = {
    astar: { name: t.astarName, desc: t.astarDesc, color: 'text-[#0A84FF] border-[#0A84FF]/30' },
    dijkstra: { name: t.dijkstraName, desc: t.dijkstraDesc, color: 'text-[#5E5CE6] border-[#5E5CE6]/30' },
    bfs: { name: t.bfsName, desc: t.bfsDesc, color: 'text-[#FF3B30] border-[#FF3B30]/30' },
  };

  return (
    <div className="space-y-3">
      <span className="ios-label">
        {t.algorithm}
      </span>

      <Tabs value={algorithm} onValueChange={(v) => onSelect(v as AlgorithmKey)}>
        <TabsList className="w-full ios-segmented h-9 p-0.5">
          {algos.map((a) => (
            <TabsTrigger
              key={a.key}
              value={a.key}
              className="flex-1 text-[11px] font-medium tracking-wide gap-1.5 ios-segmented-item h-full border-none transition-all cursor-pointer data-[state=active]:text-white data-[state=active]:bg-white/10 data-[state=active]:shadow-sm rounded-lg"
            >
              {a.icon} {a.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <button
        onClick={onCompareAll}
        className="w-full text-[11px] font-medium tracking-wide py-2.5 rounded-xl border border-white/8 bg-white/4 text-white/45 hover:border-white/15 hover:text-white hover:bg-white/8 transition-all cursor-pointer"
      >
        ⚡ Compare All
      </button>

      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-[11px] font-medium text-white/25 hover:text-white/45 transition-colors cursor-pointer py-1">
          {t.algorithmInfo}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 mt-2">
            {algos.map((a) => {
              const info = infoMap[a.key];
              return (
                <Card key={a.key} className={`glass-card border-l-2 ${algorithm === a.key ? info.color : 'border-l-transparent'}`}>
                  <CardContent className="p-3">
                    <div className={`text-[11px] font-semibold ${info.color.split(' ')[0]} mb-1`}>
                      {info.name}
                    </div>
                    <p className="text-[10px] leading-relaxed text-white/35 font-normal">
                      {info.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
