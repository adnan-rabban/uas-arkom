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
    astar: { name: t.astarName, desc: t.astarDesc, color: 'text-[#1c69d4] border-[#1c69d4]' },
    dijkstra: { name: t.dijkstraName, desc: t.dijkstraDesc, color: 'text-white border-white' },
    bfs: { name: t.bfsName, desc: t.bfsDesc, color: 'text-[#e22718] border-[#e22718]' },
  };

  return (
    <div className="space-y-3">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1c69d4]">
        {t.algorithm}
      </span>

      <Tabs value={algorithm} onValueChange={(v) => onSelect(v as AlgorithmKey)}>
        <TabsList className="w-full bg-transparent border border-[#3c3c3c] rounded-none h-8 p-0">
          {algos.map((a) => (
            <TabsTrigger
              key={a.key}
              value={a.key}
              className="flex-1 text-[9px] tracking-widest font-bold uppercase gap-1 rounded-none data-[state=active]:bg-white data-[state=active]:text-black text-white/30 h-full border-none transition-all cursor-pointer"
            >
              {a.icon} {a.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <button
        onClick={onCompareAll}
        className="w-full text-[9px] tracking-widest font-bold uppercase py-1.5 rounded-none border border-[#3c3c3c] bg-transparent text-white/40 hover:border-white hover:text-white transition-all cursor-pointer"
      >
        ⚡ Compare All
      </button>

      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-[9px] tracking-widest font-mono text-white/20 hover:text-white/40 transition-colors cursor-pointer py-1">
          {t.algorithmInfo}
          <ChevronDown className={`w-3 h-3 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 mt-2">
            {algos.map((a) => {
              const info = infoMap[a.key];
              return (
                <Card key={a.key} className={`bg-[#0d0d0d] border-[#3c3c3c] rounded-none ${algorithm === a.key ? `border-l-2 ${info.color}` : ''}`}>
                  <CardContent className="p-3">
                    <div className={`text-[9px] font-bold tracking-widest uppercase ${info.color.split(' ')[0]} mb-1`}>
                      {info.name}
                    </div>
                    <p className="text-[9px] leading-relaxed text-white/30 font-light">
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
