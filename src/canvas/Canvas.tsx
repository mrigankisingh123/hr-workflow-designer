import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  type Node,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';

/* ═══════════════════════════════════════════════
   MOCK API LAYER
═══════════════════════════════════════════════ */
const mockApi = {
  getAutomations: () => [
    { id: 'send_email',    label: 'Send Email',         params: ['to', 'subject', 'body'] },
    { id: 'slack_notify',  label: 'Slack Notification', params: ['channel', 'message'] },
    { id: 'create_ticket', label: 'Create Ticket',      params: ['project', 'priority'] },
    { id: 'update_hris',   label: 'Update HRIS',        params: ['field', 'value'] },
    { id: 'trigger_doc',   label: 'Generate Document',  params: ['template', 'output'] },
  ],
  getRoles: () => ['HR Manager', 'Team Lead', 'Director', 'VP HR', 'CHRO', 'Admin'],
  getUsers: () => ['Alice Chen', 'Bob Smith', 'Carol Wu', 'David Lee', 'Emma Park'],
};

/* ═══════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, #root { height: 100vh; width: 100vw; overflow: hidden; }

  /* Hide any h1/h2 heading injected outside the app component */
  body > h1, body > h2, #root > h1, #root > h2,
  body > div > h1, body > div > h2 { display: none !important; }

  .wf-app { font-family: 'DM Sans', sans-serif !important; }

  .sidebar-anim {
    transition: width 0.3s cubic-bezier(.4,0,.2,1),
                opacity 0.25s ease,
                transform 0.3s cubic-bezier(.4,0,.2,1);
  }

  .node-shell { transition: transform 0.18s ease, filter 0.18s ease; cursor: grab; }
  .node-shell:hover { transform: translateY(-2px); }
  .node-shell:active { cursor: grabbing; }

  .react-flow__edge-path { stroke-width: 2 !important; }
  .react-flow__edge.selected .react-flow__edge-path { stroke-width: 3 !important; }
  .react-flow__controls { border-radius: 12px !important; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important; }
  .react-flow__controls-button { width: 30px !important; height: 30px !important; border-bottom: none !important; }
  .react-flow__minimap { border-radius: 12px !important; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.10) !important; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(150,150,180,0.28); border-radius: 4px; }

  .drag-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px;
    border-radius: 9px;
    cursor: grab;
    user-select: none;
    font-size: 12.5px; font-weight: 600;
    transition: background 0.15s, transform 0.12s;
    margin-bottom: 5px;
  }
  .drag-item:hover { transform: translateX(2px); }
  .drag-item:active { cursor: grabbing; }

  .form-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 13px; }
  .form-field label { font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; }
  .form-field input, .form-field select, .form-field textarea {
    border-radius: 7px; border: 1px solid;
    padding: 7px 10px; font-size: 12.5px;
    font-family: 'DM Sans', sans-serif;
    width: 100%; outline: none;
    transition: border-color 0.15s;
  }
  .form-field textarea { resize: vertical; min-height: 60px; }

  .sim-step {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 9px 0;
    border-bottom: 1px solid;
    animation: fadeSlide 0.3s ease;
  }
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .sim-step-dot {
    width: 20px; height: 20px; border-radius: 50%;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; margin-top: 1px;
  }

  .badge {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
    padding: 2px 7px; border-radius: 20px;
    text-transform: uppercase;
  }

  .action-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    background: transparent; border-radius: 8px;
    cursor: pointer; font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    width: 100%; text-align: left;
    transition: background 0.14s, transform 0.11s;
    margin-bottom: 4px;
  }
  .action-btn:hover { transform: translateX(2px); }

  .pill-btn {
    position: absolute; top: 50%; z-index: 300;
    width: 18px; height: 48px;
    border: 1px solid; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; transition: width 0.2s ease, transform 0.05s ease;
  }
  .pill-btn:hover { width: 24px; }

  .validation-item {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 7px 10px; border-radius: 7px;
    margin-bottom: 5px; font-size: 11.5px; font-weight: 500;
  }

  .stat-badge {
    font-size: 10.5px; font-weight: 600;
    padding: 2px 8px; border-radius: 20px;
    letter-spacing: 0.03em;
  }

  @keyframes pulse-edge {
    0%,100% { stroke-opacity: 0.6; }
    50%      { stroke-opacity: 1; }
  }
`;

/* ═══════════════════════════════════════════════
   THEMES
═══════════════════════════════════════════════ */
const themes = {
  light: {
    bg: '#faf9f7', canvasBg: '#f4f2ee', dot: '#ddd9d0',
    sidebar: 'rgba(255,252,248,0.96)', sidebarBorder: 'rgba(215,205,192,0.65)',
    glass: 'rgba(255,252,248,0.88)', text: '#2c2824', sub: '#9a928a',
    label: '#bdb5ab', hover: 'rgba(0,0,0,0.04)', border: 'rgba(215,205,192,0.7)',
    ctrlBg: 'rgba(255,252,248,0.97)',
    inp: '#fff', inpBorder: '#ddd9d0', inpText: '#2c2824', inpFocus: '#6366f1',
    isDark: false,
  },
  dark: {
    bg: '#0e0d18', canvasBg: '#110f1e', dot: '#1c1a2c',
    sidebar: 'rgba(16,14,26,0.96)', sidebarBorder: 'rgba(255,255,255,0.07)',
    glass: 'rgba(16,14,26,0.9)', text: '#e6e2f2', sub: '#7a7690',
    label: '#36344e', hover: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)',
    ctrlBg: 'rgba(20,18,34,0.98)',
    inp: '#1a1830', inpBorder: 'rgba(255,255,255,0.12)', inpText: '#e6e2f2', inpFocus: '#818cf8',
    isDark: true,
  },
};

type Theme = typeof themes.light;

/* ═══════════════════════════════════════════════
   NODE CONFIGS
═══════════════════════════════════════════════ */
const NODE_CFG = {
  start:     { color: '#22c55e', bg: '#f0fdf4', darkBg: '#052e16', icon: '▶', label: 'Start'     },
  task:      { color: '#3b82f6', bg: '#eff6ff', darkBg: '#0c1a3a', icon: '✓', label: 'Task'      },
  approval:  { color: '#f59e0b', bg: '#fffbeb', darkBg: '#2d1a00', icon: '⚡', label: 'Approval' },
  automated: { color: '#a855f7', bg: '#faf5ff', darkBg: '#1e0a38', icon: '⚙', label: 'Automated' },
  end:       { color: '#f43f5e', bg: '#fff1f2', darkBg: '#2d0010', icon: '■', label: 'End'       },
} as const;

type NodeType = keyof typeof NODE_CFG;

/* ═══════════════════════════════════════════════
   CUSTOM NODE COMPONENTS
═══════════════════════════════════════════════ */
function makeNodeComp(type: NodeType, isDark: boolean) {
  const cfg    = NODE_CFG[type];
  const hasSrc = type !== 'end';
  const hasTgt = type !== 'start';

  return function NodeComp({ data, selected }: { data: Record<string, any>; selected: boolean }) {
    const selStyle: React.CSSProperties = selected
      ? { boxShadow: `0 0 0 3px ${cfg.color}55, 0 4px 20px ${cfg.color}30` }
      : {};

    return (
      <div
        className="node-shell"
        style={{
          padding: '10px 18px', borderRadius: 12,
          border: `1.5px solid ${cfg.color}55`,
          background: isDark ? cfg.darkBg : cfg.bg,
          color: cfg.color,
          minWidth: 148, fontSize: 13, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          textAlign: 'center', position: 'relative',
          boxShadow: `0 2px 12px ${cfg.color}22`,
          ...selStyle,
        }}
      >
        {hasTgt && (
          <Handle
            type="target"
            position={Position.Top}
            style={{ background: cfg.color, width: 8, height: 8, border: `2px solid ${isDark ? cfg.darkBg : cfg.bg}` }}
          />
        )}
        <span style={{ marginRight: 6, opacity: 0.8, fontSize: 12 }}>{cfg.icon}</span>
        <span>{data.label}</span>
        {data.assignee && (
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, fontWeight: 400 }}>
            👤 {data.assignee}
          </div>
        )}
        {data.automationType && (
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, fontWeight: 400 }}>
            ⚙ {data.automationType}
          </div>
        )}
        {hasSrc && (
          <Handle
            type="source"
            position={Position.Bottom}
            style={{ background: cfg.color, width: 8, height: 8, border: `2px solid ${isDark ? cfg.darkBg : cfg.bg}` }}
          />
        )}
      </div>
    );
  };
}

/* ═══════════════════════════════════════════════
   WORKFLOW VALIDATION
═══════════════════════════════════════════════ */
function validateWorkflow(nodes: Node[], edges: any[]) {
  const errors:   { msg: string }[] = [];
  const warnings: { msg: string }[] = [];

  const startNodes = nodes.filter(n => n.type === 'start');
  const endNodes   = nodes.filter(n => n.type === 'end');

  if (startNodes.length === 0) errors.push({ msg: 'No Start node found' });
  if (startNodes.length > 1)  errors.push({ msg: `Multiple Start nodes (${startNodes.length})` });
  if (endNodes.length === 0)  errors.push({ msg: 'No End node found' });

  const connectedIds = new Set<string>();
  edges.forEach(e => { connectedIds.add(e.source); connectedIds.add(e.target); });
  const isolated = nodes.filter(n => !connectedIds.has(n.id) && nodes.length > 1);
  if (isolated.length > 0) warnings.push({ msg: `${isolated.length} unconnected node(s)` });

  // Cycle detection (DFS)
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => { if (adj[e.source]) adj[e.source].push(e.target); });
  const visited  = new Set<string>();
  const recStack = new Set<string>();
  let hasCycle   = false;

  function dfs(id: string): boolean {
    visited.add(id); recStack.add(id);
    for (const nb of (adj[id] || [])) {
      if (!visited.has(nb) && dfs(nb)) return true;
      if (recStack.has(nb)) return true;
    }
    recStack.delete(id);
    return false;
  }
  for (const id of Object.keys(adj)) {
    if (!visited.has(id) && dfs(id)) { hasCycle = true; break; }
  }
  if (hasCycle) warnings.push({ msg: 'Cycle detected in workflow' });

  return { errors, warnings, valid: errors.length === 0 };
}

/* ═══════════════════════════════════════════════
   WORKFLOW SIMULATION
═══════════════════════════════════════════════ */
function buildStepDetail(node: Node): string {
  const d = node.data as Record<string, any>;
  if (node.type === 'task')
    return [d.assignee && `Assignee: ${d.assignee}`, d.dueDate && `Due: ${d.dueDate}`, d.description]
      .filter(Boolean).join(' · ') || 'No details';
  if (node.type === 'approval')
    return [d.approverRole && `Approver: ${d.approverRole}`, d.threshold && `Threshold: ${d.threshold}`]
      .filter(Boolean).join(' · ') || 'Awaiting approval';
  if (node.type === 'automated')
    return d.automationType ? `Action: ${d.automationType}` : 'Automated action';
  if (node.type === 'start')  return d.metadata || 'Workflow begins';
  if (node.type === 'end')    return d.message  || 'Workflow complete';
  return '';
}

function simulateWorkflow(nodes: Node[], edges: any[]) {
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => { if (adj[e.source]) adj[e.source].push(e.target); });

  const nodeMap: Record<string, Node> = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  const startNode = nodes.find(n => n.type === 'start');
  if (!startNode) return [];

  const steps: { id: string; label: string; color: string; icon: string; detail: string }[] = [];
  const visited = new Set<string>();
  const queue   = [startNode.id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodeMap[id];
    if (!node) continue;
    const cfg = NODE_CFG[node.type as NodeType] ?? NODE_CFG.task;
    steps.push({ id, label: (node.data as any).label, color: cfg.color, icon: cfg.icon, detail: buildStepDetail(node) });
    (adj[id] || []).forEach(nid => { if (!visited.has(nid)) queue.push(nid); });
  }
  return steps;
}

/* ═══════════════════════════════════════════════
   NODE FORM PANEL
═══════════════════════════════════════════════ */
function NodeFormPanel({ selectedNode, onUpdate, theme: t }: {
  selectedNode: Node | null;
  onUpdate: (id: string, data: Record<string, any>) => void;
  theme: Theme;
}) {
  const automations = mockApi.getAutomations();
  const roles       = mockApi.getRoles();
  const users       = mockApi.getUsers();

  if (!selectedNode) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: t.sub, fontSize: 12 }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◎</div>
        <div>Select a node to edit its properties</div>
      </div>
    );
  }

  const { type, id, data } = selectedNode;
  const d   = data as Record<string, any>;
  const cfg = NODE_CFG[type as NodeType] ?? NODE_CFG.task;
  const set = (key: string, val: any) => onUpdate(id, { [key]: val });

  const inp: React.CSSProperties = {
    background: t.inp, borderColor: t.inpBorder, color: t.inpText,
    fontFamily: "'DM Sans', sans-serif",
  };
  const lbl: React.CSSProperties = { color: t.label };

  return (
    <div style={{ padding: '16px 14px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${cfg.color}22`, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {cfg.icon}
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: t.text }}>{cfg.label} Properties</div>
          <div style={{ fontSize: 10, color: t.label, marginTop: 1, fontFamily: "'DM Mono', monospace" }}>id: {id}</div>
        </div>
      </div>

      {/* Label — all nodes */}
      <div className="form-field">
        <label style={lbl}>Label</label>
        <input style={inp} value={d.label || ''} onChange={e => set('label', e.target.value)} placeholder="Node label" />
      </div>

      {/* Task */}
      {type === 'task' && (<>
        <div className="form-field">
          <label style={lbl}>Description</label>
          <textarea style={inp} value={d.description || ''} onChange={e => set('description', e.target.value)} placeholder="Task description…" />
        </div>
        <div className="form-field">
          <label style={lbl}>Assignee</label>
          <select style={inp} value={d.assignee || ''} onChange={e => set('assignee', e.target.value)}>
            <option value="">— select assignee —</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label style={lbl}>Due Date</label>
          <input type="date" style={inp} value={d.dueDate || ''} onChange={e => set('dueDate', e.target.value)} />
        </div>
        <div className="form-field">
          <label style={lbl}>Priority</label>
          <select style={inp} value={d.priority || 'medium'} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </>)}

      {/* Approval */}
      {type === 'approval' && (<>
        <div className="form-field">
          <label style={lbl}>Approver Role</label>
          <select style={inp} value={d.approverRole || ''} onChange={e => set('approverRole', e.target.value)}>
            <option value="">— select role —</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label style={lbl}>Approval Threshold</label>
          <select style={inp} value={d.threshold || 'single'} onChange={e => set('threshold', e.target.value)}>
            <option value="single">Single approver</option>
            <option value="majority">Majority vote</option>
            <option value="unanimous">Unanimous</option>
          </select>
        </div>
        <div className="form-field">
          <label style={lbl}>Timeout (days)</label>
          <input type="number" min="1" max="30" style={inp} value={d.timeout || ''} onChange={e => set('timeout', e.target.value)} placeholder="e.g. 3" />
        </div>
        <div className="form-field">
          <label style={lbl}>On Reject → Notify</label>
          <select style={inp} value={d.rejectNotify || ''} onChange={e => set('rejectNotify', e.target.value)}>
            <option value="">— select —</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </>)}

      {/* Automated */}
      {type === 'automated' && (<>
        <div className="form-field">
          <label style={lbl}>Automation Type</label>
          <select style={inp} value={d.automationType || ''} onChange={e => set('automationType', e.target.value)}>
            <option value="">— select automation —</option>
            {automations.map(a => <option key={a.id} value={a.label}>{a.label}</option>)}
          </select>
        </div>
        {d.automationType && (() => {
          const found = automations.find(a => a.label === d.automationType);
          if (!found) return null;
          return found.params.map(param => (
            <div key={param} className="form-field">
              <label style={lbl}>{param.replace(/_/g, ' ')}</label>
              <input style={inp} value={d[`param_${param}`] || ''} onChange={e => set(`param_${param}`, e.target.value)} placeholder={param} />
            </div>
          ));
        })()}
        <div className="form-field">
          <label style={lbl}>Retry on Failure</label>
          <select style={inp} value={d.retry || 'none'} onChange={e => set('retry', e.target.value)}>
            <option value="none">No retry</option>
            <option value="once">Retry once</option>
            <option value="3x">Retry 3×</option>
          </select>
        </div>
      </>)}

      {/* Start */}
      {type === 'start' && (<>
        <div className="form-field">
          <label style={lbl}>Trigger</label>
          <select style={inp} value={d.trigger || 'manual'} onChange={e => set('trigger', e.target.value)}>
            <option value="manual">Manual</option>
            <option value="scheduled">Scheduled</option>
            <option value="event">Event-based</option>
            <option value="api">API call</option>
          </select>
        </div>
        <div className="form-field">
          <label style={lbl}>Metadata / Notes</label>
          <textarea style={inp} value={d.metadata || ''} onChange={e => set('metadata', e.target.value)} placeholder="Workflow context…" />
        </div>
      </>)}

      {/* End */}
      {type === 'end' && (<>
        <div className="form-field">
          <label style={lbl}>Completion Message</label>
          <input style={inp} value={d.message || ''} onChange={e => set('message', e.target.value)} placeholder="Workflow completed successfully" />
        </div>
        <div className="form-field">
          <label style={lbl}>Post-completion Action</label>
          <select style={inp} value={d.postAction || 'none'} onChange={e => set('postAction', e.target.value)}>
            <option value="none">None</option>
            <option value="notify_all">Notify all participants</option>
            <option value="archive">Archive record</option>
            <option value="trigger_next">Trigger next workflow</option>
          </select>
        </div>
      </>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SIMULATION PANEL
═══════════════════════════════════════════════ */
function SimulationPanel({ nodes, edges, theme: t, onHighlight }: {
  nodes: Node[];
  edges: any[];
  theme: Theme;
  onHighlight: (id: string | null) => void;
}) {
  const [steps, setSteps]     = useState<ReturnType<typeof simulateWorkflow>>([]);
  const [current, setCurrent] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = () => {
    const s = simulateWorkflow(nodes, edges);
    if (s.length === 0) return;
    setSteps(s); setCurrent(-1); setRunning(true);
    let i = 0;
    const tick = () => {
      setCurrent(i);
      onHighlight(s[i]?.id ?? null);
      i++;
      if (i < s.length) timerRef.current = setTimeout(tick, 800);
      else setRunning(false);
    };
    tick();
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSteps([]); setCurrent(-1); setRunning(false);
    onHighlight(null);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.label }}>
        Simulation
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={run} disabled={running}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 9,
            background: running ? t.hover : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: running ? t.sub : '#fff', border: 'none',
            cursor: running ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {running ? '⏳ Running…' : '▶ Run Workflow'}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '9px 14px', borderRadius: 9,
            background: 'transparent', border: `1px solid ${t.border}`,
            color: t.sub, cursor: 'pointer', fontWeight: 600, fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >⟳</button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {steps.length === 0 && !running && (
          <div style={{ color: t.label, fontSize: 11.5, textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>
            Press Run to simulate<br />step-by-step execution
          </div>
        )}
        {steps.map((s, i) => (
          <div key={s.id} className="sim-step" style={{ borderBottomColor: t.border, opacity: i > current ? 0.3 : 1, transition: 'opacity 0.3s' }}>
            <div className="sim-step-dot" style={{ background: i <= current ? s.color : t.border, color: i <= current ? '#fff' : t.label }}>
              {i < current ? '✓' : i === current ? s.icon : i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text, marginBottom: 2 }}>{s.label}</div>
              {s.detail && <div style={{ fontSize: 11, color: t.sub, lineHeight: 1.5 }}>{s.detail}</div>}
            </div>
            {i < current && (
              <div className="badge" style={{ background: '#22c55e22', color: '#22c55e', flexShrink: 0 }}>done</div>
            )}
            {i === current && running && (
              <div className="badge" style={{ background: `${s.color}22`, color: s.color, flexShrink: 0 }}>active</div>
            )}
          </div>
        ))}
        {steps.length > 0 && current >= steps.length - 1 && !running && (
          <div style={{ textAlign: 'center', padding: '14px 0', color: '#22c55e', fontSize: 12, fontWeight: 600 }}>
            ✓ Simulation complete
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   VALIDATION PANEL
═══════════════════════════════════════════════ */
function ValidationPanel({ nodes, edges, theme: t }: { nodes: Node[]; edges: any[]; theme: Theme }) {
  const { errors, warnings, valid } = validateWorkflow(nodes, edges);
  return (
    <div style={{ padding: '14px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.label }}>
          Validation
        </div>
        <div className="badge" style={valid ? { background: '#22c55e22', color: '#22c55e' } : { background: '#ef444422', color: '#ef4444' }}>
          {valid ? 'valid' : 'invalid'}
        </div>
      </div>
      {errors.map((e, i) => (
        <div key={i} className="validation-item" style={{ background: '#ef444412', color: '#ef4444' }}>
          <span>✕</span><span>{e.msg}</span>
        </div>
      ))}
      {warnings.map((w, i) => (
        <div key={i} className="validation-item" style={{ background: '#f59e0b12', color: '#d97706' }}>
          <span>⚠</span><span>{w.msg}</span>
        </div>
      ))}
      {errors.length === 0 && warnings.length === 0 && (
        <div className="validation-item" style={{ background: '#22c55e12', color: '#22c55e' }}>
          <span>✓</span><span>No issues found</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   UNDO / REDO HOOK
═══════════════════════════════════════════════ */
function useHistory(initialNodes: Node[], initialEdges: any[]) {
  const [idx, setIdx] = useState(0);
  const history = useRef<{ nodes: Node[]; edges: any[] }[]>([{ nodes: initialNodes, edges: initialEdges }]);

  const push = useCallback((nodes: Node[], edges: any[]) => {
    history.current = history.current.slice(0, idx + 1);
    history.current.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    setIdx(history.current.length - 1);
  }, [idx]);

  const undo = useCallback(() => {
    if (idx <= 0) return null;
    const ni = idx - 1;
    setIdx(ni);
    return history.current[ni];
  }, [idx]);

  const redo = useCallback(() => {
    if (idx >= history.current.length - 1) return null;
    const ni = idx + 1;
    setIdx(ni);
    return history.current[ni];
  }, [idx]);

  return { push, undo, redo, canUndo: idx > 0, canRedo: idx < history.current.length - 1 };
}

/* ═══════════════════════════════════════════════
   INITIAL DATA
═══════════════════════════════════════════════ */
const INIT_NODES: Node[] = [
  { id: '1', type: 'start',     position: { x: 260, y: 40  }, data: { label: 'Start Onboarding',   trigger: 'event',  metadata: 'New hire accepted offer' } },
  { id: '2', type: 'task',      position: { x: 180, y: 160 }, data: { label: 'Collect Documents',  assignee: 'Alice Chen', priority: 'high' } },
  { id: '3', type: 'automated', position: { x: 340, y: 160 }, data: { label: 'Send Welcome Email', automationType: 'Send Email' } },
  { id: '4', type: 'approval',  position: { x: 260, y: 290 }, data: { label: 'Manager Approval',   approverRole: 'HR Manager', threshold: 'single' } },
  { id: '5', type: 'end',       position: { x: 260, y: 400 }, data: { label: 'Onboarding Complete', message: 'Employee fully onboarded' } },
];
const INIT_EDGES = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#22c55e66' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#22c55e66' } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#3b82f666' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#a855f766' } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#f59e0b66' } },
];

/* ═══════════════════════════════════════════════
   CANVAS INNER
═══════════════════════════════════════════════ */
function CanvasInner() {
  const [isDark, setIsDark]               = useState(false);
  const [leftOpen, setLeftOpen]           = useState(true);
  const [rightOpen, setRightOpen]         = useState(true);
  const [rightTab, setRightTab]           = useState<'form' | 'sim' | 'validate'>('form');
  const [simHighlight, setSimHighlight]   = useState<string | null>(null);
  const t = isDark ? themes.dark : themes.light;

  const nodeTypes = useMemo(() => ({
    start:     makeNodeComp('start',     isDark),
    task:      makeNodeComp('task',      isDark),
    approval:  makeNodeComp('approval',  isDark),
    automated: makeNodeComp('automated', isDark),
    end:       makeNodeComp('end',       isDark),
  }), [isDark]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Record<string, any>>(INIT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INIT_EDGES);
  const [selectedNode, setSelectedNode]  = useState<Node | null>(null);

  const rfWrapper                    = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition }     = useReactFlow();
  const histCtrl                     = useHistory(INIT_NODES, INIT_EDGES);

  const histPush = useCallback(() => {
    setTimeout(() => histCtrl.push(nodes, edges), 0);
  }, [nodes, edges, histCtrl]);

  /* ── Connect */
  const onConnect = useCallback((conn: Connection) => {
    const src       = nodes.find(n => n.id === conn.source);
    const edgeColor = src ? (NODE_CFG[src.type as NodeType]?.color ?? '#94a3b8') + '66' : '#94a3b866';
    setEdges(es => addEdge({ ...conn, animated: true, style: { stroke: edgeColor } }, es));
    histPush();
  }, [nodes, histPush, setEdges]);

  /* ── Drag & drop */
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow-type') as NodeType;
    if (!type || !NODE_CFG[type] || !rfWrapper.current) return;

    const rect     = rfWrapper.current.getBoundingClientRect();
    const position = screenToFlowPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const cfg      = NODE_CFG[type];

    const newNode: Node = {
      id:       `${type}-${Date.now()}`,
      type:     type as string,
      position,
      data:     { label: cfg.label },
    };
    setNodes((ns: Node[]) => [...ns, newNode]);
    histPush();
  }, [screenToFlowPosition, histPush, setNodes]);

  /* ── Undo / Redo */
  const doUndo = useCallback(() => {
    const snap = histCtrl.undo();
    if (snap) { setNodes(snap.nodes); setEdges(snap.edges); }
  }, [histCtrl, setNodes, setEdges]);

  const doRedo = useCallback(() => {
    const snap = histCtrl.redo();
    if (snap) { setNodes(snap.nodes); setEdges(snap.edges); }
  }, [histCtrl, setNodes, setEdges]);

  /* ── Keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) doUndo();
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) doRedo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doUndo, doRedo]);

  /* ── Node update */
  const handleUpdateNode = (id: string, data: Record<string, any>) => {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
    setSelectedNode(prev => prev?.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev);
  };

  /* ── Delete */
  const deleteSelected = () => {
    if (!selectedNode) return;
    setNodes(ns => ns.filter(n => n.id !== selectedNode.id));
    setEdges(es => es.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    histPush();
  };

  /* ── Save / Load / Export / Import */
  const saveWorkflow = () => {
    localStorage.setItem('wf_v2', JSON.stringify({ nodes, edges }));
    alert('✓ Workflow saved');
  };
  const loadWorkflow = () => {
    const s = localStorage.getItem('wf_v2');
    if (s) { const f = JSON.parse(s); setNodes(f.nodes || []); setEdges(f.edges || []); setSelectedNode(null); }
    else alert('No saved workflow found');
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'workflow.json';
    a.click();
  };
  const importJSON = () => {
    const inp     = document.createElement('input');
    inp.type      = 'file';
    inp.accept    = '.json';
    inp.onchange  = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader    = new FileReader();
      reader.onload   = ev => {
        try { const f = JSON.parse(ev.target?.result as string); setNodes(f.nodes || []); setEdges(f.edges || []); }
        catch { alert('Invalid JSON file'); }
      };
      reader.readAsText(file);
    };
    inp.click();
  };

  const { valid } = validateWorkflow(nodes, edges);
  const LW = 230, RW = 280;

  const sideStyle = (open: boolean, isRight = false): React.CSSProperties => ({
    width:       open ? (isRight ? RW : LW) : 0,
    flexShrink:  0,
    height:      '100%',
    background:  t.sidebar,
    borderRight: !isRight && open ? `1px solid ${t.sidebarBorder}` : 'none',
    borderLeft:  isRight  && open ? `1px solid ${t.sidebarBorder}` : 'none',
    overflow:    'hidden',
    opacity:     open ? 1 : 0,
    transition:  'width 0.3s cubic-bezier(.4,0,.2,1), opacity 0.25s ease',
    display:     'flex',
    flexDirection: 'column',
  });

  const secLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: t.label,
    marginBottom: 8, marginTop: 4, paddingLeft: 2,
  };

  const pillStyle = (side: 'left' | 'right', open: boolean): React.CSSProperties => {
    if (side === 'left') {
      return {
        left: open ? LW - 1 : 0,
        top: '50%', transform: 'translateY(-50%)',
        borderRadius: '0 10px 10px 0',
        border: `1px solid ${t.sidebarBorder}`,
        borderLeft: open ? 'none' : `1px solid ${t.sidebarBorder}`,
        background: t.sidebar, color: t.sub,
        boxShadow: '2px 0 8px rgba(0,0,0,0.07)',
        transition: 'left 0.3s cubic-bezier(.4,0,.2,1), width 0.2s ease',
        zIndex: 300,
      };
    }
    return {
      right: open ? RW : 0,
      top: '50%', transform: 'translateY(-50%)',
      borderRadius: '10px 0 0 10px',
      border: `1px solid ${t.sidebarBorder}`,
      borderRight: 'none',
      background: t.sidebar, color: t.sub,
      boxShadow: '-2px 0 8px rgba(0,0,0,0.07)',
      transition: 'right 0.3s cubic-bezier(.4,0,.2,1), width 0.2s ease',
      zIndex: 400,
      pointerEvents: 'all',
    };
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="wf-app" style={{ display: 'flex', width: '100vw', height: '100vh', background: t.bg, position: 'relative', overflow: 'hidden' }}>

        {/* ══ LEFT SIDEBAR ══ */}
        <div className="sidebar-anim" style={sideStyle(leftOpen)}>
          <div style={{ padding: '20px 13px 16px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            {/* Brand */}
            <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>Workflow</div>
              <div style={{ fontSize: 10.5, color: t.sub, marginTop: 2 }}>HR Designer v2</div>
            </div>

            {/* Theme toggle */}
            <button className="action-btn" onClick={() => setIsDark(d => !d)}
              style={{ marginBottom: 14, border: `1px solid ${isDark ? 'rgba(130,100,255,0.3)' : t.border}`, color: isDark ? '#a78bfa' : t.sub, background: isDark ? 'rgba(120,100,255,0.1)' : 'transparent' }}>
              <span style={{ fontSize: 14 }}>{isDark ? '☀️' : '🌙'}</span>
              <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
            </button>

            {/* Undo / Redo */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['undo', 'redo'] as const).map(action => {
                const can    = action === 'undo' ? histCtrl.canUndo : histCtrl.canRedo;
                const handle = action === 'undo' ? doUndo : doRedo;
                return (
                  <button key={action} onClick={handle} disabled={!can}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: can ? t.sub : t.label, cursor: can ? 'pointer' : 'default', fontSize: 11.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                    {action === 'undo' ? '↩ Undo' : '↪ Redo'}
                  </button>
                );
              })}
            </div>

            {/* Drag nodes */}
            <div style={secLabel}>Drag to Canvas</div>
            {(Object.entries(NODE_CFG) as [NodeType, typeof NODE_CFG[NodeType]][]).map(([type, cfg]) => (
              <div key={type} className="drag-item" draggable
                onDragStart={e => { e.dataTransfer.setData('application/reactflow-type', type); e.dataTransfer.effectAllowed = 'move'; }}
                style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}30`, borderLeft: `3px solid ${cfg.color}`, color: cfg.color }}>
                <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5, fontFamily: "'DM Mono', monospace" }}>drag</span>
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${t.border}`, margin: '12px 0' }} />

            {/* Workflow actions */}
            <div style={secLabel}>Workflow</div>
            {([
              { label: 'Save',        icon: '💾', fn: saveWorkflow },
              { label: 'Load',        icon: '📂', fn: loadWorkflow },
              { label: 'Export JSON', icon: '📤', fn: exportJSON   },
              { label: 'Import JSON', icon: '📥', fn: importJSON   },
            ] as const).map(({ label, icon, fn }) => (
              <button key={label} className="action-btn" onClick={fn}
                style={{ border: `1px solid ${t.border}`, color: t.sub, borderRadius: 8 }}>
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}

            {/* Stats */}
            <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
              {[{ k: 'Nodes', v: nodes.length }, { k: 'Edges', v: edges.length }].map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.label, marginBottom: 5 }}>
                  <span>{k}</span>
                  <span className="stat-badge" style={{ background: t.hover, color: t.sub }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.label, marginTop: 2 }}>
                <span>Status</span>
                <span className="badge" style={valid ? { background: '#22c55e22', color: '#22c55e' } : { background: '#ef444422', color: '#ef4444' }}>
                  {valid ? '✓ valid' : '✕ invalid'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Left pill */}
        <button className="pill-btn" onClick={() => setLeftOpen(o => !o)} style={pillStyle('left', leftOpen)}>
          {leftOpen ? '‹' : '›'}
        </button>

        {/* ══ CANVAS ══ */}
        <div
  ref={rfWrapper}
  style={{
    flex: 1,
    height: '100%',
    minWidth: 0,
    position: 'relative',
    overflow: 'hidden',   // ✅ ADD THIS
  }}
          onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes.map(n => ({
              ...n,
              style: simHighlight === n.id
                ? { outline: `3px solid ${NODE_CFG[n.type as NodeType]?.color}`, outlineOffset: 3, borderRadius: 14 }
                : {},
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => { setSelectedNode(node); setRightOpen(true); setRightTab('form'); }}
            onPaneClick={() => setSelectedNode(null)}
            onEdgeClick={(_, edge) => { setEdges(es => es.filter(e => e.id !== edge.id)); histPush(); }}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: t.canvasBg }}
            defaultEdgeOptions={{ animated: true, markerEnd: { type: MarkerType.ArrowClosed } }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color={t.dot} />
            {/* Controls moved up: bottom-left with extra bottom offset */}
            <Controls
              position="bottom-left"
              style={{
                background: t.ctrlBg,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                marginBottom: 60,
              }}
            />
            {/* MiniMap moved up: bottom-right with margin to avoid right panel overlap */}
            <MiniMap
              position="bottom-right"
              style={{
                background: t.ctrlBg,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                marginBottom: 60,
                marginRight: 12,
              }}
              maskColor={isDark ? 'rgba(14,13,24,0.6)' : 'rgba(244,242,238,0.7)'}
              nodeColor={n => NODE_CFG[n.type as NodeType]?.color ?? '#94a3b8'}
            />
          </ReactFlow>

          {/* Hint */}
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: t.glass, border: `1px solid ${t.border}`, borderRadius: 8, padding: '5px 12px', backdropFilter: 'blur(8px)', zIndex: 10, pointerEvents: 'none' }}>
            <span style={{ fontSize: 10.5, color: t.label }}>Drag nodes from sidebar · Click edge to delete · Ctrl+Z undo</span>
          </div>
        </div>

        {/* Right pill */}
        <button className="pill-btn" onClick={() => setRightOpen(o => !o)} style={pillStyle('right', rightOpen)}>
          {rightOpen ? '›' : '‹'}
        </button>

        {/* ══ RIGHT PANEL ══ */}
        <div className="sidebar-anim" style={sideStyle(rightOpen, true)}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
              {([
                { key: 'form',     icon: '◈', label: 'Props'    },
                { key: 'sim',      icon: '▶', label: 'Simulate' },
                { key: 'validate', icon: '✓', label: 'Validate' },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setRightTab(tab.key)}
                  style={{ flex: 1, padding: '11px 2px', border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: "'DM Sans', sans-serif", fontSize: 10.5, fontWeight: 600, color: rightTab === tab.key ? t.text : t.sub, borderBottom: rightTab === tab.key ? `2px solid ${t.inpFocus}` : '2px solid transparent', transition: 'color 0.15s, border-color 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 10.5 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Delete button */}
            {rightTab === 'form' && selectedNode && (
              <button onClick={deleteSelected}
                style={{ width: '100%', padding: '9px', flexShrink: 0, background: 'linear-gradient(135deg, #ef4444, #f43f5e)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11.5, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                🗑 Delete Node
              </button>
            )}

            <div style={{ flex: 1, overflow: 'hidden' }}>
              {rightTab === 'form'     && <NodeFormPanel     selectedNode={selectedNode} onUpdate={handleUpdateNode} theme={t} />}
              {rightTab === 'sim'      && <SimulationPanel   nodes={nodes} edges={edges} theme={t} onHighlight={setSimHighlight} />}
              {rightTab === 'validate' && <ValidationPanel   nodes={nodes} edges={edges} theme={t} />}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════════ */
export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}