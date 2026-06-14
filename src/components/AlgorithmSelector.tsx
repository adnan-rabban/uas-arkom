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
  lang: Language;
}

export function AlgorithmSelector({ algorithm, onSelect, lang }: AlgorithmSelectorProps) {
  const t = translations[lang];
  const [infoOpen, setInfoOpen] = useState(false);

  const algos: { key: AlgorithmKey; label: string; icon: React.ReactNode }[] = [
    { key: 'astar', label: 'A*', icon: <Zap className="w-3 h-3" /> },
    { key: 'dijkstra', label: 'Dijkstra', icon: <Route className="w-3 h-3" /> },
    { key: 'bfs', label: 'BFS', icon: <Layers className="w-3 h-3" /> },
  ];

  const infoMap: Record<AlgorithmKey, { name: string; desc: string; color: string }> = {
    astar: { name: t.astarName, desc: t.astarDesc, color: 'text-[#D97706] border-[#D97706]/30' },
    dijkstra: { name: t.dijkstraName, desc: t.dijkstraDesc, color: 'text-[#6B7280] border-[#6B7280]/30' },
    bfs: { name: t.bfsName, desc: t.bfsDesc, color: 'text-[#BE123C] border-[#BE123C]/30' },
  };

  return (
    <div className="space-y-2">
      <span className="ios-label">
        {t.algorithm}
      </span>

      <Tabs value={algorithm} onValueChange={(v) => onSelect(v as AlgorithmKey)}>
        <TabsList className="w-full ios-segmented h-9 p-0.5">
          {algos.map((a) => (
            <TabsTrigger
              key={a.key}
              value={a.key}
              className="flex-1 text-[11px] font-medium tracking-[-0.01em] gap-1.5 ios-segmented-item h-full border-none transition-all cursor-pointer data-[state=active]:text-slate-800 data-[state=active]:bg-white data-[state=active]:shadow-[0_1px_4px_rgba(0,0,0,0.1),inset_0_0.5px_0_rgba(255,255,255,0.9),0_0_0_0.5px_rgba(0,0,0,0.04)] rounded-lg"
            >
              {a.icon} {a.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer py-1">
          {t.algorithmInfo}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${infoOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-1.5 mt-1.5">
            {algos.map((a) => {
              const info = infoMap[a.key];
              return (
                <Card key={a.key} className={`glass-card border-l-2 ${algorithm === a.key ? info.color : 'border-l-transparent'} transition-all duration-300 hover:border-black/12`}>
                  <CardContent className="p-2">
                    <div className={`text-[10px] font-semibold ${info.color.split(' ')[0]} mb-0.5`}>
                      {info.name}
                    </div>
                    <p className="text-[9.5px] leading-relaxed text-slate-400 font-normal">
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
