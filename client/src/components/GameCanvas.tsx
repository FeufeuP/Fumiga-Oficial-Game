import { useEffect, useRef, useState } from 'react';
import type { BetaCard, BetaHudState, RunSummary } from '@/game/beta/BetaData';
import { createPhaserGame, type GameHandle } from '@/game/PhaserGame';

const victoryConfetti = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  x: (index * 37) % 100,
  delay: (index % 9) * 0.08,
  duration: 2.4 + (index % 5) * 0.22,
  drift: ((index * 29) % 80) - 40,
  color: ['#55ff00', '#ffb800', '#ff5b4d', '#74d6ff', '#fff1c7'][index % 5],
}));
const initialHud: BetaHudState = { layer: 'surface', layerLabel: 'SUPERFÍCIE · BOSQUE ÚMIDO', surfaceResources: 6, surfaceThreats: 4, biomass: 100, biomassCapacity: 220, specialBiomass: 1, royalJelly: 0, queenHp: 100, queenMaxHp: 100, workers: 4, collectors: 2, soldiers: 2, enemies: 4, rooms: 1, excavated: 0, mode: 'active', selectedAction: null, lastAction: 'A colônia aguarda uma ordem.', timeScale: 1, runTime: 0, seed: 731204, wave: 1, nextWaveIn: 16 };

export default function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<GameHandle | null>(null);
  const [hud, setHud] = useState<BetaHudState>(initialHud);
  const [cards, setCards] = useState<BetaCard[]>([]);
  const [mutationOpen, setMutationOpen] = useState(false);
  const [runEnd, setRunEnd] = useState<RunSummary | null>(null);

  useEffect(() => {
    if (!hostRef.current || handleRef.current) return;
    const handle = createPhaserGame(hostRef.current);
    handleRef.current = handle;
    const unsubscribeHud = handle.eventBus.on('beta:hud', setHud);
    const unsubscribeMutation = handle.eventBus.on('mutation:opened', ({ cards: nextCards }) => { setCards(nextCards); setMutationOpen(true); });
    const unsubscribeMutationClosed = handle.eventBus.on('mutation:closed', () => setMutationOpen(false));
    const unsubscribeRun = handle.eventBus.on('run:ended', setRunEnd);
    return () => { unsubscribeHud(); unsubscribeMutation(); unsubscribeMutationClosed(); unsubscribeRun(); handle.dispose(); handleRef.current = null; };
  }, []);

  const command = (type: 'new-run' | 'open-mutation' | 'build-pantry' | 'save-meta' | 'choose-mutation' | 'toggle-layer' | 'spawn-elite', cardId?: string) => handleRef.current?.eventBus.emit('command', { type, cardId });
  const hpPercent = Math.max(0, Math.min(100, (hud.queenHp / hud.queenMaxHp) * 100));
  const isPaused = hud.mode === 'tactical' || hud.mode === 'mutation' || hud.mode === 'gameover';

  return (
    <div className="fumiga-shell">
      <div ref={hostRef} className="fumiga-canvas-host" />
      <div className="fumiga-overlay" aria-live="polite">
        <header className="top-hud beta-top-hud">
          <div className="brand-lockup"><div><span>FUMIGA / BETA 0.1</span><strong>Colônia de Origem</strong><em>{hud.layerLabel}</em></div></div>
          <div className="resource-strip beta-resource-strip">
            <div><span className="resource-dot green" />BIOMASSA <b>{hud.biomass}/{hud.biomassCapacity}</b></div>
            <div><span className="resource-dot gold" />GELEIA <b>{hud.royalJelly}</b></div>
            <div><span className="resource-dot special" />ESPECIAL <b>{hud.specialBiomass}</b></div>
          </div>
        </header>

        <div className="beta-actions">
          <button className="beta-action-button layer-toggle" type="button" onClick={() => command('toggle-layer')}><span>{hud.layer === 'surface' ? '↓ SUBTERRÂNEO' : '↑ SUPERFÍCIE'}</span><small>{hud.layer === 'surface' ? 'CÂMARA' : 'BOSQUE'}</small></button>
          <button className="beta-action-button" type="button" onClick={() => command('build-pantry')} disabled={isPaused}>+ DESPENSA <small>40 BIO</small></button>
          <button className="beta-action-button" type="button" onClick={() => command('open-mutation')} disabled={hud.specialBiomass < 1 || hud.mode !== 'active'}>MUTAÇÃO <small>ESCOLHER</small></button>
          <button className="beta-action-button quiet" type="button" onClick={() => command('save-meta')}>SALVAR META</button>
        </div>
        {!!hud.unlockedEliteClasses?.length && <div className="elite-caste-panel"><div className="panel-kicker">CASTAS ELITE · INCUBAR</div>{hud.unlockedEliteClasses.map((elite) => <button type="button" key={elite.id} disabled={isPaused || hud.biomass < elite.cost} onClick={() => command('spawn-elite', elite.id)}><span>{elite.name}</span><b>{elite.cost} BIO</b></button>)}</div>}

        <div className="tactical-card beta-mode-card"><span className={`live-dot ${hud.mode !== 'active' ? 'tactical' : ''}`} /><div><small>{hud.mode === 'tactical' ? 'PAUSA TÁTICA' : hud.mode === 'mutation' ? 'ESCOLHA GENÉTICA' : hud.mode === 'gameover' ? 'RUN ENCERRADA' : 'BETA · SIMULAÇÃO ATIVA'}</small><strong>{hud.mode === 'tactical' ? hud.selectedAction ?? 'ARRASTE PARA ORDENAR' : hud.mode === 'mutation' ? 'BIOMASSA ESPECIAL' : hud.mode === 'gameover' ? 'PERMADEATH' : 'LONG PRESS PARA COMANDAR'}</strong></div><span className="scale-readout">×{hud.timeScale.toFixed(1)}</span></div>
        <div className="colony-brief"><span>{hud.layer === 'surface' ? 'RECURSOS' : 'OPERÁRIAS'} <b>{hud.layer === 'surface' ? hud.surfaceResources : hud.workers}</b></span><span>{hud.layer === 'surface' ? 'AMEAÇAS' : 'SOLDADOS'} <b>{hud.layer === 'surface' ? hud.surfaceThreats : hud.soldiers}</b></span><span>ONDA <b>{hud.wave ?? 1}</b></span><span>{hud.nextWaveIn ? `PRÓXIMA ${hud.nextWaveIn}s` : 'INVASÃO'}</span></div>
        {hud.eliteAlert && <div className="compact-alert" role="status"><b>{hud.eliteAlert.name}</b><span>{hud.eliteAlert.ability} · {hud.eliteAlert.seconds.toFixed(1)}s</span></div>}

        <div className="queen-hud beta-queen-hud"><div className="queen-label"><span>RAINHA · CÂMARA CENTRAL</span><b>{hud.queenHp}/{hud.queenMaxHp}</b></div><div className="hp-track"><span style={{ width: `${hpPercent}%` }} /></div><p>{hud.lastAction}</p></div>
        <div className="beta-log"><span>RUN {Math.floor(hud.runTime).toString().padStart(3, '0')}s</span><span>SEED {hud.seed}</span><span>{hud.enemies ? 'AMEAÇA DETECTADA' : 'BIOMA LIMPO'}</span></div>
        <div className="bottom-hint"><span className="touch-icon">◉</span><span>segure no ninho para pausar · arraste até CAVAR, ATACAR ou COLETAR</span></div>

        {mutationOpen && <div className="beta-modal-shell" role="dialog" aria-modal="true"><div className="mutation-panel"><div className="mutation-heading"><span>BIOMASSA ESPECIAL / ESCOLHA 01</span><h2>Qual mutação guia esta colônia?</h2><p>A simulação está pausada. Uma confirmação aplica a carta uma única vez.</p></div><div className="mutation-cards">{cards.map((card) => <button className={`mutation-card rarity-${card.rarity}`} key={card.id} type="button" onClick={() => command('choose-mutation', card.id)}><span className="card-rarity">{card.rarity.toUpperCase()} · {card.lineage}</span><strong>{card.name}</strong><p>{card.description}</p><small>APLICAR MUTADOR →</small></button>)}</div></div></div>}

        {runEnd && <div className={`beta-modal-shell ${runEnd.result === 'victory' ? 'victory-shell' : ''}`} role="dialog" aria-modal="true"><div className={`run-end-panel ${runEnd.result === 'victory' ? 'victory-panel' : ''}`}>{runEnd.result === 'victory' && <div className="victory-cinema" aria-hidden="true"><div className="victory-rays" /><div className="victory-burst"><i /><i /><i /><i /><i /><i /><i /><i /></div>{victoryConfetti.map((piece) => <i className="pixel-confetti" key={piece.id} style={{ '--confetti-x': `${piece.x}%`, '--confetti-delay': `${piece.delay}s`, '--confetti-duration': `${piece.duration}s`, '--confetti-drift': `${piece.drift}px`, '--confetti-color': piece.color } as React.CSSProperties} />)}</div>}<span>{runEnd.result === 'victory' ? 'BIOMA CONQUISTADO · VITÓRIA' : 'RUN SUMMARY · DERROTA'}</span><h2>{runEnd.result === 'victory' ? 'A Matriarca caiu!' : 'A Rainha caiu.'}</h2><p>{runEnd.summary}</p>{runEnd.result === 'victory' && <div className="score-banner"><small>{runEnd.isPersonalBest ? 'NOVO RECORDE PESSOAL' : 'PONTUAÇÃO DA RUN'}</small><strong>{runEnd.score.toLocaleString('pt-BR')}</strong><b>#{runEnd.rank} NO RANKING LOCAL</b></div>}<div className="victory-rewards"><div><b>+{runEnd.biomassReward}</b><small>BIOMASSA</small></div><div><b>+{runEnd.royalJellyReward}</b><small>GELEIA REAL</small></div><div><b>{runEnd.bossDefeated ? 'CHEFE' : '—'}</b><small>RESULTADO</small></div></div><div className="victory-stats"><div><span>DURAÇÃO</span><b>{runEnd.duration}s</b></div><div><span>ONDA FINAL</span><b>{runEnd.wave}</b></div><div><span>ELIMINAÇÕES</span><b>{runEnd.enemiesDefeated}</b></div><div><span>ELITES</span><b>{runEnd.elitesDefeated}</b></div><div><span>DANO CAUSADO</span><b>{runEnd.damageDealt}</b></div><div><span>DANO RECEBIDO</span><b>{runEnd.damageTaken}</b></div><div><span>MUTAÇÕES</span><b>{runEnd.mutations}</b></div><div><span>RAINHA</span><b>{runEnd.queenHp}/{runEnd.queenMaxHp}</b></div></div>{runEnd.result === 'victory' && <div className="records-panel"><div className="panel-kicker">MELHORES PONTUAÇÕES · LOCAL</div>{runEnd.personalRecords.slice(0, 5).map((record, index) => <div className={`record-row ${record.runId === runEnd.runId ? 'record-current' : ''}`} key={`${record.runId}-${record.achievedAt}`}><b>#{index + 1}</b><span>{record.score.toLocaleString('pt-BR')} pts · ONDA {record.wave}</span><small>{record.runId === runEnd.runId ? 'ESTA RUN' : `${record.duration}s`}</small></div>)}</div>}<button className="primary-beta-button" type="button" onClick={() => { setRunEnd(null); command('new-run'); }}>NOVA RUN</button></div></div>}

      </div>
    </div>
  );
}
