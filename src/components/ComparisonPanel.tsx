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
    astar: 'border-[#1c69d4]',
    dijkstra: 'border-[#0653b6]',
    bfs: 'border-[#e22718]',
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="shrink-0">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-5 py-2.5 border-t border-[#3c3c3c] bg-[#0d0d0d] hover:bg-white/2 transition-colors cursor-pointer rounded-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1c69d4]">
            {t.comparison}
          </span>
          <span className="text-[9px] text-white/15">— {t.comparisonSubtitle}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-5 py-4 bg-black border-t border-[#3c3c3c] select-none">
          <div className="grid grid-cols-4 gap-2">
            {(() => {
              const maxExplored = Math.max(...results.map((r) => r.result.visitOrder.length));
              const maxPath = Math.max(...results.map((r) => r.result.path.length));

              return results.map((r) => {
                const isBest = r.result.visitOrder.length === minExplored;
                return (
                  <Card key={r.algorithm} className={`bg-[#0d0d0d] border-[#3c3c3c] rounded-none ${isBest ? `${algoColors[r.algorithm]} border-t-2` : ''}`}>
                    <CardContent className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <span className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                          {r.label}
                        </span>
                        {isBest && (
                          <Badge variant="secondary" className="bg-[#e22718] text-white border-none text-[8px] px-1.5 py-0.5 rounded-none font-bold uppercase tracking-wider">
                            <Trophy className="w-2.5 h-2.5 mr-0.5" />
                            {t.bestLabel}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Explored Nodes count & bar */}
                      <div className={`text-xl font-mono font-bold ${isBest ? 'text-white' : 'text-white/30'}`}>
                        {r.result.visitOrder.length}
                      </div>
                      <div className="text-[8px] tracking-wider uppercase text-white/15 mt-0.5">{t.nodesExplored}</div>
                      <div className="w-full bg-white/5 h-1 mt-1 rounded-none overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            r.algorithm === 'astar' ? 'bg-[#1c69d4]' : r.algorithm === 'bfs' ? 'bg-[#e22718]' : 'bg-white/40'
                          }`} 
                          style={{ width: `${maxExplored > 0 ? (r.result.visitOrder.length / maxExplored) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Path Length count & bar */}
                      <div className={`text-sm font-mono mt-3 ${r.result.path.length > 0 ? 'text-emerald-400' : 'text-red-400/50'}`}>
                        {r.result.path.length || 'N/A'}
                      </div>
                      <div className="text-[8px] tracking-wider uppercase text-white/15">{t.pathLength}</div>
                      {r.result.path.length > 0 && (
                        <div className="w-full bg-white/5 h-1 mt-1 rounded-none overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500/60 transition-all duration-500" 
                            style={{ width: `${maxPath > 0 ? (r.result.path.length / maxPath) * 100 : 0}%` }}
                          />
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-white/20 mt-3">{r.result.time}ms</div>
                      <div className="text-[8px] tracking-wider uppercase text-white/15">{t.computeTime}</div>
                    </CardContent>
                  </Card>
                );
              });
            })()}

            <Card className="bg-[#0d0d0d] border-[#3c3c3c] rounded-none border-l-2 border-l-[#e22718]">
              <CardContent className="p-3 text-center flex flex-col justify-center h-full">
                <div className="text-[10px] font-semibold tracking-wider text-white/40 uppercase mb-2">
                  A* vs BFS
                </div>
                <div className="text-2xl font-mono font-bold text-[#e22718]">
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
