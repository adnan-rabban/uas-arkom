import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Trophy } from 'lucide-react';
import { useState } from 'react';
import type { ComparisonResult, Language } from '@/types';
import { translations } from '@/lib/constants';

interface ComparisonPanelProps {
  results: ComparisonResult[] | null;
  lang: Language;
}

export function ComparisonPanel({ results, lang }: ComparisonPanelProps) {
  const [open, setOpen] = useState(true);
  const t = translations[lang];

  if (!results || results.length === 0) return null;

  const minExplored = Math.min(...results.map((r) => r.result.visitOrder.length));
  const bfsResult = results.find((r) => r.algorithm === 'bfs');
  const astarResult = results.find((r) => r.algorithm === 'astar');

  const efficiency = bfsResult && astarResult && bfsResult.result.visitOrder.length > 0
    ? Math.round((1 - astarResult.result.visitOrder.length / bfsResult.result.visitOrder.length) * 100)
    : 0;

  const algoColors: Record<string, string> = {
    astar: 'border-sky-500/30',
    dijkstra: 'border-violet-500/30',
    bfs: 'border-amber-500/30',
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-5 py-2.5 border-t border-white/5 bg-[#060b16] hover:bg-white/[0.02] transition-colors cursor-pointer">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-sky-400/50">
            {t.comparison}
          </span>
          <span className="text-[9px] text-white/15">— {t.comparisonSubtitle}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-5 py-4 bg-[#04080f] border-t border-white/5">
          <div className="grid grid-cols-4 gap-2">
            {results.map((r) => {
              const isBest = r.result.visitOrder.length === minExplored;
              return (
                <Card key={r.algorithm} className={`bg-white/[0.02] border-white/5 ${isBest ? algoColors[r.algorithm] : ''}`}>
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <span className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                        {r.label}
                      </span>
                      {isBest && (
                        <Badge variant="secondary" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[8px] px-1 py-0">
                          <Trophy className="w-2.5 h-2.5 mr-0.5" />
                          {t.bestLabel}
                        </Badge>
                      )}
                    </div>
                    <div className={`text-xl font-mono font-bold ${isBest ? 'text-sky-300' : 'text-white/30'}`}>
                      {r.result.visitOrder.length}
                    </div>
                    <div className="text-[8px] tracking-wider uppercase text-white/15 mt-0.5">{t.nodesExplored}</div>
                    <div className={`text-sm font-mono mt-2 ${r.result.path.length > 0 ? 'text-emerald-400' : 'text-red-400/50'}`}>
                      {r.result.path.length || 'N/A'}
                    </div>
                    <div className="text-[8px] tracking-wider uppercase text-white/15">{t.pathLength}</div>
                    <div className="text-[10px] font-mono text-white/20 mt-2">{r.result.time}ms</div>
                    <div className="text-[8px] tracking-wider uppercase text-white/15">{t.computeTime}</div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="bg-white/[0.02] border-white/5 border-l-2 border-emerald-500/30">
              <CardContent className="p-3 text-center flex flex-col justify-center h-full">
                <div className="text-[10px] font-semibold tracking-wider text-white/40 uppercase mb-2">
                  A* vs BFS
                </div>
                <div className="text-2xl font-mono font-bold text-emerald-400">
                  {efficiency}%
                </div>
                <div className="text-[8px] tracking-wider uppercase text-white/15 mt-0.5">
                  {t.fewerNodes}
                </div>
                <p className="text-[9px] leading-relaxed text-white/20 mt-2">
                  {t.astarDesc.split('.')[0]}.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
