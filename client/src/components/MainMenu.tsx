import { useCallback, useEffect, useMemo, useState } from 'react';
import '@/menu.css';
import GameCanvas from './GameCanvas';
import { META_TREE, type MetaProgression, type PersonalRecord } from '@/game/beta/BetaData';
import { SaveManager } from '@/game/beta/SaveManager';
import { downloadTextFile, readTextFile, saveFileName } from '@/lib/saveFile';

type MenuPanel = 'options' | 'stats' | 'achievements' | 'progression' | 'credits' | 'test' | null;

const menuItems: Array<{ id: Exclude<MenuPanel, null>; label: string; eyebrow: string }> = [
  { id: 'options', label: 'OPÇÕES', eyebrow: 'CONFIGURAÇÃO' },
  { id: 'stats', label: 'ESTATÍSTICAS', eyebrow: 'MEMÓRIA DA COLÔNIA' },
  { id: 'achievements', label: 'CONQUISTAS', eyebrow: 'MARCAS DO ENXAME' },
  { id: 'progression', label: 'PROGRESSÃO', eyebrow: 'ÁRVORE DA COLÔNIA' },
  { id: 'credits', label: 'CRÉDITOS', eyebrow: 'EQUIPE' },
  { id: 'test', label: 'TESTE', eyebrow: 'PLAYTEST · DIAGNÓSTICO' },
];

const IDLE_TEST_STATUS = 'Nenhuma operação nesta sessão. Exporte para conferir o JSON do save.';

export default function MainMenu() {
  const [started, setStarted] = useState(false);
  const [entering, setEntering] = useState(false);
  const [panel, setPanel] = useState<MenuPanel>(null);
  const [meta, setMeta] = useState<MetaProgression | null>(null);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [testPreview, setTestPreview] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState(IDLE_TEST_STATUS);
  const [purchaseMessage, setPurchaseMessage] = useState('Selecione um nó para investir Geleia Real.');
  const saveManager = useMemo(() => new SaveManager(), []);

  const refreshFromStorage = useCallback(async () => {
    setMeta(await saveManager.loadMeta());
    setRecords(saveManager.loadRecords());
  }, [saveManager]);

  useEffect(() => { refreshFromStorage(); }, [refreshFromStorage]);

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

  const exportSave = async () => {
    const json = await saveManager.exportSave();
    const file = downloadTextFile(saveFileName(meta?.profileId ?? 'local_profile'), json);
    setTestPreview(json);
    setTestStatus(`Save exportado como ${file} · ${json.length} caracteres · ${records.length} recorde(s).`);
  };

  const importSave = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await saveManager.importSave(await readTextFile(file));
    if (result.ok) {
      setMeta(result.meta);
      setRecords(saveManager.loadRecords());
      setTestStatus(`Save importado de ${file.name}. Progressão substituída.`);
    } else {
      setTestStatus(`Importação recusada: ${result.reason ?? 'motivo desconhecido.'}`);
    }
    event.target.value = '';
  };

  const resetSave = async () => {
    const fresh = await saveManager.reset();
    setMeta(fresh);
    setRecords([]);
    setTestPreview(null);
    setTestStatus('Save local apagado. Progressão voltou ao padrão de fábrica.');
  };

  const purchasedNodes = Object.values(meta?.skillTree ?? {}).filter((level) => level > 0).length;

  return (
    <main className="main-menu" aria-label="Menu principal do FUMIGA" data-panel-root="main-menu" data-ready={meta ? 'true' : 'false'}>
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
        <button className="menu-play" type="button" data-menu-item="play" onClick={beginColony} disabled={entering}><span className="menu-arrow">▶</span><strong>JOGAR</strong><small>{entering ? 'entrando no mundo...' : 'iniciar nova colônia'}</small></button>
        {menuItems.map((item) => <button className="menu-item" type="button" key={item.id} data-menu-item={item.id} onClick={() => setPanel(item.id)} disabled={entering}><span>{item.eyebrow}</span><strong>{item.label}</strong></button>)}
      </nav>

      <div className="menu-caption"><span className="menu-pulse" /> segure para comandar · sobreviva à floresta</div>

      {entering && <div className="menu-transition" aria-live="polite"><div className="transition-sun" /><div className="transition-line" /><strong>O INSTINTO DESPERTA</strong><span>entrando no Bosque Úmido</span></div>}

      {panel && <section className="menu-dialog-backdrop" role="presentation" onClick={() => setPanel(null)}><div className={`menu-dialog ${panel === 'progression' ? 'progression-dialog' : ''} ${panel === 'test' ? 'test-dialog' : ''}`} role="dialog" aria-modal="true" aria-labelledby="menu-dialog-title" data-panel={panel} onClick={(event) => event.stopPropagation()}><button className="menu-dialog-close" type="button" onClick={() => setPanel(null)}>FECHAR ×</button><span>{menuItems.find((item) => item.id === panel)?.eyebrow}</span><h2 id="menu-dialog-title">{menuItems.find((item) => item.id === panel)?.label}</h2>{panel === 'options' && <div className="menu-options"><label>VOLUME GERAL <input type="range" defaultValue="78" /></label><label>VIBRAÇÃO <button type="button" className="toggle-chip">ATIVA</button></label><label>IDIOMA <b>PORTUGUÊS (BR)</b></label></div>}{panel === 'stats' && <div className="menu-stat-grid"><b>{String(meta?.statistics.runs ?? 0).padStart(2, '0')} <small>RUNS</small></b><b>{String(meta?.statistics.victories ?? 0).padStart(2, '0')} <small>VITÓRIAS</small></b><b>{String(meta?.statistics.queenDeaths ?? 0).padStart(2, '0')} <small>RAINHAS PERDIDAS</small></b><b>731204 <small>SEMENTE ATUAL</small></b></div>}{panel === 'achievements' && <p className="menu-copy">As marcas do enxame serão gravadas quando a colônia sobreviver ao primeiro bioma.</p>}{panel === 'progression' && <div className="progression-content"><div className="jelly-wallet"><span>GELEIA REAL DISPONÍVEL</span><strong>{meta?.royalJelly ?? 0}</strong></div><p className="progression-hint">Compre melhorias permanentes. Pré-requisitos e custos são aplicados de forma atômica.</p>{(['attributes', 'infrastructure', 'elite'] as const).map((branch) => <section className="progression-branch" key={branch}><h3>{branch === 'attributes' ? 'ATRIBUTOS' : branch === 'infrastructure' ? 'INFRAESTRUTURA' : 'ELITE'}</h3><div className="progression-grid">{META_TREE.filter((node) => node.branch === branch).map((node) => { const level = meta?.skillTree[node.id] ?? 0; const locked = node.requires.some((requirement) => !(meta?.skillTree[requirement] ?? 0)); const affordable = (meta?.royalJelly ?? 0) >= node.cost; return <button className={`progression-node ${level ? 'purchased' : ''} ${locked ? 'locked' : ''}`} type="button" key={node.id} disabled={Boolean(level || locked || !affordable)} onClick={() => buyNode(node.id)}><div><strong>{node.name}</strong><small>{level ? 'DESBLOQUEADO' : `${node.cost} GELEIA`}</small></div><p>{node.description}</p><em>{level ? 'ATIVO NA PRÓXIMA RUN' : locked ? 'PRÉ-REQUISITO BLOQUEADO' : !affordable ? 'GELEIA INSUFICIENTE' : node.effect}</em></button>; })}</div></section>)}<div className="purchase-message">{purchaseMessage}</div></div>}{panel === 'test' && <div className="menu-test" data-testid="test-panel"><p className="test-hint">Ferramentas de playtest. O save é um JSON portátil: exporte antes de limpar o armazenamento e importe em outra máquina.</p><div className="test-grid"><b><span data-testid="test-schema">{meta?.schemaVersion ?? 0}</span><small>SCHEMA</small></b><b><span data-testid="test-jelly">{meta?.royalJelly ?? 0}</span><small>GELEIA REAL</small></b><b><span data-testid="test-runs">{String(meta?.statistics.runs ?? 0).padStart(2, '0')}</span><small>RUNS</small></b><b><span data-testid="test-records">{records.length}</span><small>RECORDES</small></b><b><span data-testid="test-nodes">{purchasedNodes}</span><small>NÓS COMPRADOS</small></b><b><span data-testid="test-profile">{meta?.profileId ?? '—'}</span><small>PERFIL</small></b></div><div className="test-actions"><button className="test-button primary" type="button" data-testid="test-export" onClick={exportSave}>EXPORTAR SAVE<small>DOWNLOAD .JSON</small></button><label className="test-button">IMPORTAR SAVE<small>SELECIONAR .JSON</small><input type="file" accept="application/json,.json" data-testid="test-import" onChange={importSave} /></label><button className="test-button danger" type="button" data-testid="test-reset" onClick={resetSave}>RESETAR SAVE<small>APAGAR LOCAL</small></button></div><pre className="test-preview" data-testid="test-preview">{testPreview ?? 'Nenhum save exportado nesta sessão.'}</pre><p className="test-status" role="status" data-testid="test-status">{testStatus}</p></div>}{panel === 'credits' && <p className="menu-copy">FUMIGA PROJECT<br /><br />Um jogo sobre instinto, sacrifício e a memória de uma colônia.<br /><br /><small>DESENVOLVIMENTO · FUMIGA TEAM</small></p>}</div></section>}
    </main>
  );
}
