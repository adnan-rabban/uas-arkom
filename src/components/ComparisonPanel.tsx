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
    astar: 'border-[#0A84FF]/40',
    dijkstra: 'border-[#5E5CE6]/40',
    bfs: 'border-[#FF3B30]/40',
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="shrink-0">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-5 py-3 border-t border-white/6 bg-white/2 hover:bg-white/4 transition-colors cursor-pointer rounded-none">
        <div className="flex items-center gap-2">
          <span className="ios-label">
            {t.comparison}
          </span>
          <span className="text-[10px] text-white/20 font-medium">— {t.comparisonSubtitle}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/25 transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-5 py-4 bg-white/2 border-t border-white/6 select-none">
          <div className="flex items-center justify-end mb-3">
            <label className="flex items-center gap-2 cursor-pointer text-white/50 hover:text-white/80 transition-colors select-none text-[11px] font-medium">
              <input
                type="checkbox"
                checked={simultaneous}
                onChange={(e) => onToggleSimultaneous(e.target.checked)}
                className="w-4 h-4 rounded-md border-white/15 bg-white/6 text-[#0A84FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>{lang === 'id' ? 'Animasikan Bersamaan' : 'Animate Simultaneously'}</span>
            </label>
          </div>
          <div className="grid grid-cols-4 gap-3">
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
                    className={`glass-card cursor-pointer transition-all duration-300 hover:scale-[1.01] select-none ${
                      isVisualizing
                        ? `border-2 ${algoColors[r.algorithm]} shadow-[0_0_20px_rgba(0,122,255,0.12)]`
                        : 'hover:border-white/15'
                    }`}
                  >
                    <CardContent className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span className="text-[11px] font-semibold text-white/45">
                          {r.label}
                        </span>
                        {isBest && (
                          <Badge variant="secondary" className="bg-[#FF3B30]/15 text-[#FF453A] border-none text-[9px] px-2 py-0.5 rounded-full font-semibold">
                            <Trophy className="w-3 h-3 mr-0.5" />
                            {t.bestLabel}
                          </Badge>
                        )}
                        {isVisualizing && (
                          <Badge variant="secondary" className="bg-[#0A84FF]/15 text-[#0A84FF] border-none text-[9px] px-2 py-0.5 rounded-full font-semibold animate-pulse">
                            {lang === 'id' ? 'AKTIF' : 'ACTIVE'}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Explored Nodes count & bar */}
                      <div className={`text-xl font-mono font-bold ${isBest ? 'text-white' : 'text-white/30'}`}>
                        {r.result.visitOrder.length}
                      </div>
                      <div className="text-[9px] font-medium text-white/20 mt-0.5">{t.nodesExplored}</div>
                      <div className="w-full bg-white/6 h-1 mt-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            r.algorithm === 'astar' ? 'bg-[#0A84FF]' : r.algorithm === 'bfs' ? 'bg-[#FF3B30]' : 'bg-[#5E5CE6]'
                          }`} 
                          style={{ width: `${maxExplored > 0 ? (r.result.visitOrder.length / maxExplored) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Path Steps & Cost */}
                      <div className="grid grid-cols-2 gap-1 mt-3 border-t border-white/6 pt-2.5">
                        <div>
                          <div className={`text-sm font-mono font-bold ${r.result.path.length > 0 ? 'text-[#32D74B]' : 'text-[#FF453A]/50'}`}>
                            {r.result.path.length || 'N/A'}
                          </div>
                          <div className="text-[8px] font-medium text-white/25">{t.pathLength}</div>
                        </div>
                        <div>
                          <div className={`text-sm font-mono font-bold ${r.result.path.length > 0 ? 'text-[#64D2FF]' : 'text-[#FF453A]/50'}`}>
                            {r.result.pathCost !== undefined ? r.result.pathCost : 'N/A'}
                          </div>
                          <div className="text-[8px] font-medium text-white/25">{t.pathCost}</div>
                        </div>
                      </div>
                      {r.result.path.length > 0 && (
                        <div className="w-full bg-white/6 h-1 mt-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#32D74B]/60 transition-all duration-500 rounded-full" 
                            style={{ width: `${maxPath > 0 ? (r.result.path.length / maxPath) * 100 : 0}%` }}
                          />
                        </div>
                      )}

                      <div className="text-[11px] font-mono text-white/25 mt-3">{r.result.time}ms</div>
                      <div className="text-[9px] font-medium text-white/18">{t.computeTime}</div>
                    </CardContent>
                  </Card>
                );
              });
            })()}

            <Card className="glass-card border-l-2 border-l-[#FF3B30]/60">
              <CardContent className="p-3.5 text-center flex flex-col justify-center h-full">
                <div className="text-[11px] font-semibold text-white/45 mb-2">
                  A* vs BFS
                </div>
                <div className="text-2xl font-mono font-bold text-[#FF9F0A]">
                  {efficiency}%
                </div>
                <div className="text-[9px] font-medium text-white/20 mt-0.5">
                  {t.fewerNodes}
                </div>
                <p className="text-[10px] leading-relaxed text-white/25 mt-2">
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
