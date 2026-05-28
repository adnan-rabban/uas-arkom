import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Trophy } from 'lucide-react';
import { useState } from 'react';
import type { ComparisonResult, Language, AlgorithmKey } from '@/types';
import { translations } from '@/lib/constants';

interface ComparisonPanelProps {
  results: ComparisonResult[] | null;
  lang: Language;
  visualizedAlgo: AlgorithmKey;
  onSelectVisualization: (algo: AlgorithmKey) => void;
  simultaneous: boolean;
  onToggleSimultaneous: (v: boolean) => void;
}

export function ComparisonPanel({
  results,
  lang,
  visualizedAlgo,
  onSelectVisualization,
  simultaneous,
  onToggleSimultaneous,
}: ComparisonPanelProps) {
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
          <div className="flex items-center justify-end mb-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-white/50 hover:text-white/80 transition-colors select-none text-[9px] uppercase font-mono tracking-wider">
              <input
                type="checkbox"
                checked={simultaneous}
                onChange={(e) => onToggleSimultaneous(e.target.checked)}
                className="w-3.5 h-3.5 rounded-none border-[#3c3c3c] bg-black text-[#1c69d4] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>{lang === 'id' ? 'Animasikan Bersamaan' : 'Animate Simultaneously'}</span>
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(() => {
              const maxExplored = Math.max(...results.map((r) => r.result.visitOrder.length));
              const maxPath = Math.max(...results.map((r) => r.result.path.length));

              return results.map((r) => {
                const isBest = r.result.visitOrder.length === minExplored;
                const isVisualizing = visualizedAlgo === r.algorithm;
                return (
                  <Card
                    key={r.algorithm}
                    onClick={() => onSelectVisualization(r.algorithm as AlgorithmKey)}
                    className={`bg-[#0d0d0d] rounded-none cursor-pointer transition-all duration-300 hover:scale-[1.01] select-none ${
                      isVisualizing
                        ? `border-2 ${algoColors[r.algorithm]} shadow-[0_0_12px_rgba(28,105,212,0.2)]`
                        : 'border-[#3c3c3c] hover:border-white/20'
                    }`}
                  >
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
                        {isVisualizing && (
                          <Badge variant="secondary" className="bg-[#1c69d4] text-white border-none text-[8px] px-1.5 py-0.5 rounded-none font-bold uppercase tracking-wider animate-pulse">
                            {lang === 'id' ? 'AKTIF' : 'ACTIVE'}
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

                      {/* Path Steps & Cost */}
                      <div className="grid grid-cols-2 gap-1 mt-3 border-t border-white/5 pt-2">
                        <div>
                          <div className={`text-sm font-mono font-bold ${r.result.path.length > 0 ? 'text-emerald-400' : 'text-red-400/50'}`}>
                            {r.result.path.length || 'N/A'}
                          </div>
                          <div className="text-[7px] tracking-wider uppercase text-white/30">{t.pathLength}</div>
                        </div>
                        <div>
                          <div className={`text-sm font-mono font-bold ${r.result.path.length > 0 ? 'text-[#38bdf8]' : 'text-red-400/50'}`}>
                            {r.result.pathCost !== undefined ? r.result.pathCost : 'N/A'}
                          </div>
                          <div className="text-[7px] tracking-wider uppercase text-white/30">{t.pathCost}</div>
                        </div>
                      </div>
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
