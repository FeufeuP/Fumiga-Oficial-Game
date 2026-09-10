import { useEffect, useMemo, useState } from 'react';
import '@/menu.css';
import GameCanvas from './GameCanvas';
import { META_TREE, type MetaProgression } from '@/game/beta/BetaData';
import { SaveManager } from '@/game/beta/SaveManager';

type MenuPanel = 'options' | 'stats' | 'achievements' | 'progression' | 'credits' | null;

const menuItems: Array<{ id: Exclude<MenuPanel, null>; label: string; eyebrow: string }> = [
  { id: 'options', label: 'OPÇÕES', eyebrow: 'CONFIGURAÇÃO' },
  { id: 'stats', label: 'ESTATÍSTICAS', eyebrow: 'MEMÓRIA DA COLÔNIA' },
  { id: 'achievements', label: 'CONQUISTAS', eyebrow: 'MARCAS DO ENXAME' },
  { id: 'progression', label: 'PROGRESSÃO', eyebrow: 'ÁRVORE DA COLÔNIA' },
  { id: 'credits', label: 'CRÉDITOS', eyebrow: 'EQUIPE' },
];

export default function MainMenu() {
  const [started, setStarted] = useState(false);
  const [entering, setEntering] = useState(false);
  const [panel, setPanel] = useState<MenuPanel>(null);
  const [meta, setMeta] = useState<MetaProgression | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState('Selecione um nó para investir Geleia Real.');
  const saveManager = useMemo(() => new SaveManager(), []);
  useEffect(() => { saveManager.loadMeta().then(setMeta); }, [saveManager]);

  if (started) return <GameCanvas />;

  const beginColony = () => {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => setStarted(true), 1250);
  };
  const buyNode = async (nodeId: string) => {
    const result = await saveManager.purchaseNode(nodeId);
    setMeta(result.meta);
    setPurchaseMessage(result.ok ? 'Melhoria comprada. Ela será aplicada na próxima run.' : result.reason ?? 'Compra recusada.');
  };

  return (
    <main className={`main-menu${entering ? ' is-entering' : ''}`} aria-label="Menu principal do FUMIGA">
      <div className="menu-backdrop" />
      <div className="menu-grain" />
      <div className="menu-fireflies" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <header className="menu-header">
        <span className="menu-kicker">ROGUELITE · COLONY-SIM · ESTRATÉGIA INDIRETA</span>
        <h1>FUMIGA</h1>
        <p>onde o instinto constrói o império</p>
      </header>

      <div className="menu-mark" aria-label="Identidade FUMIGA"><span>✣</span><b>F</b></div>
      <div className="menu-version">BETA 0.1<br /><span>BOSQUE ÚMIDO</span></div>

      <nav className="main-menu-nav" aria-label="Menu do jogo">
        <button className="menu-play" type="button" onClick={beginColony} disabled={entering}><span className="menu-arrow">▶</span><strong>JOGAR</strong><small>{entering ? 'entrando no mundo...' : 'iniciar nova colônia'}</small></button>
        {menuItems.map((item) => <button className="menu-item" type="button" key={item.id} onClick={() => setPanel(item.id)} disabled={entering}><span>{item.eyebrow}</span><strong>{item.label}</strong></button>)}
      </nav>

      <div className="menu-caption"><span className="menu-pulse" /> segure para comandar · sobreviva à floresta</div>

      {entering && <div className="menu-transition" aria-live="polite"><div className="transition-sun" /><div className="transition-line" /><strong>O INSTINTO DESPERTA</strong><span>entrando no Bosque Úmido</span></div>}

      {panel && <section className="menu-dialog-backdrop" role="presentation" onClick={() => setPanel(null)}><div className={`menu-dialog ${panel === 'progression' ? 'progression-dialog' : ''}`} role="dialog" aria-modal="true" aria-labelledby="menu-dialog-title" onClick={(event) => event.stopPropagation()}><button className="menu-dialog-close" type="button" onClick={() => setPanel(null)}>FECHAR ×</button><span>{menuItems.find((item) => item.id === panel)?.eyebrow}</span><h2 id="menu-dialog-title">{menuItems.find((item) => item.id === panel)?.label}</h2>{panel === 'options' && <div className="menu-options"><label>VOLUME GERAL <input type="range" defaultValue="78" /></label><label>VIBRAÇÃO <button type="button" className="toggle-chip">ATIVA</button></label><label>IDIOMA <b>PORTUGUÊS (BR)</b></label></div>}{panel === 'stats' && <div className="menu-stat-grid"><b>00 <small>RUNS</small></b><b>00 <small>VITÓRIAS</small></b><b>00 <small>RAINHAS</small></b><b>731204 <small>SEMENTE ATUAL</small></b></div>}{panel === 'achievements' && <p className="menu-copy">As marcas do enxame serão gravadas quando a colônia sobreviver ao primeiro bioma.</p>}{panel === 'progression' && <div className="progression-content"><div className="jelly-wallet"><span>GELEIA REAL DISPONÍVEL</span><strong>{meta?.royalJelly ?? 0}</strong></div><p className="progression-hint">Compre melhorias permanentes. Pré-requisitos e custos são aplicados de forma atômica.</p>{(['attributes', 'infrastructure', 'elite'] as const).map((branch) => <section className="progression-branch" key={branch}><h3>{branch === 'attributes' ? 'ATRIBUTOS' : branch === 'infrastructure' ? 'INFRAESTRUTURA' : 'ELITE'}</h3><div className="progression-grid">{META_TREE.filter((node) => node.branch === branch).map((node) => { const level = meta?.skillTree[node.id] ?? 0; const locked = node.requires.some((requirement) => !(meta?.skillTree[requirement] ?? 0)); const affordable = (meta?.royalJelly ?? 0) >= node.cost; return <button className={`progression-node ${level ? 'purchased' : ''} ${locked ? 'locked' : ''}`} type="button" key={node.id} disabled={Boolean(level || locked || !affordable)} onClick={() => buyNode(node.id)}><div><strong>{node.name}</strong><small>{level ? 'DESBLOQUEADO' : `${node.cost} GELEIA`}</small></div><p>{node.description}</p><em>{level ? 'ATIVO NA PRÓXIMA RUN' : locked ? 'PRÉ-REQUISITO BLOQUEADO' : !affordable ? 'GELEIA INSUFICIENTE' : node.effect}</em></button>; })}</div></section>)}<div className="purchase-message">{purchaseMessage}</div></div>}{panel === 'credits' && <p className="menu-copy">FUMIGA PROJECT<br /><br />Um jogo sobre instinto, sacrifício e a memória de uma colônia.<br /><br /><small>DESENVOLVIMENTO · FUMIGA TEAM</small></p>}</div></section>}
    </main>
  );
}
