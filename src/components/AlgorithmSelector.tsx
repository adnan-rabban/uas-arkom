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
    astar: { name: t.astarName, desc: t.astarDesc, color: 'text-sky-400 border-sky-500/30' },
    dijkstra: { name: t.dijkstraName, desc: t.dijkstraDesc, color: 'text-violet-400 border-violet-500/30' },
    bfs: { name: t.bfsName, desc: t.bfsDesc, color: 'text-amber-400 border-amber-500/30' },
  };

  return (
    <div className="space-y-3">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-sky-400/50">
        {t.algorithm}
      </span>

      <Tabs value={algorithm} onValueChange={(v) => onSelect(v as AlgorithmKey)}>
        <TabsList className="w-full bg-white/3 border border-white/5 h-8">
          {algos.map((a) => (
            <TabsTrigger
              key={a.key}
              value={a.key}
              className="flex-1 text-[10px] tracking-wider font-mono gap-1 data-[state=active]:bg-sky-500/15 data-[state=active]:text-sky-300 text-white/30 h-6"
            >
              {a.icon} {a.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <button
        onClick={onCompareAll}
        className="w-full text-[10px] tracking-wider font-mono py-1.5 rounded-md border border-white/5 bg-white/2 text-white/30 hover:text-sky-300 hover:border-sky-500/20 hover:bg-sky-500/5 transition-all cursor-pointer"
      >
        ⚡ Compare All
      </button>

      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-[10px] tracking-wider font-mono text-white/25 hover:text-white/40 transition-colors cursor-pointer py-1">
          {t.algorithmInfo}
          <ChevronDown className={`w-3 h-3 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 mt-2">
            {algos.map((a) => {
              const info = infoMap[a.key];
              return (
                <Card key={a.key} className={`bg-white/2 border-white/5 ${algorithm === a.key ? `border-l-2 ${info.color}` : ''}`}>
                  <CardContent className="p-3">
                    <div className={`text-[10px] font-semibold tracking-wider ${info.color.split(' ')[0]} mb-1`}>
                      {info.name}
                    </div>
                    <p className="text-[9px] leading-relaxed text-white/30">
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
