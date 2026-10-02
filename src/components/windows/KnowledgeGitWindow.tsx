import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Code2,
  Database,
  FileText,
  GitBranch,
  GitCommitHorizontal,
  Layers,
  Sparkles,
  Check,
  X,
  Eye,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { LearningUnit, NoteItem, UserArtifact } from '../../types.ts';
import { telemetryEngine } from '../../services/telemetryEngine.ts';
import { epistemicLedgerService, EpistemicLedgerData } from '../../services/epistemicLedgerService.ts';
import { playChime } from '../../utils/audio.ts';

interface KnowledgeGitWindowProps {
  nodes: Array<{ id: string; title: string; subtitle?: string; sprint?: string; unitId?: string; status?: string; passingScore?: number; score?: number; phase?: number; phaseTitle?: string }>;
  notes: NoteItem[];
  artifacts: UserArtifact[];
  units?: Record<string, LearningUnit>;
  onLaunchUnit?: (unitId: string) => void;
}

const formatPath = (value: string) => value.replace(/[\s/\\:]+/g, '-').toLowerCase();

const BRANCHES = [
  { name: 'main', label: 'production knowledge', desc: 'Утверждённые инварианты, завершённые модули и проверенные факты' },
  { name: 'feature/personalized-path', label: 'adaptive learning path', desc: 'Активные блоки, пользовательские заметки и текущие цели' },
  { name: 'research/debugging-loop', label: 'error recovery & telemetry', desc: 'Сигналы затруднений, разборы граничных случаев и исправления' },
];

export const KnowledgeGitWindow: React.FC<KnowledgeGitWindowProps> = ({
  nodes,
  notes,
  artifacts,
  onLaunchUnit,
}) => {
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [telemetryState, setTelemetryState] = useState(() => telemetryEngine.getState());
  const [ledgerData, setLedgerData] = useState<EpistemicLedgerData | null>(null);

  // Selected file for built-in Git file viewer
  const [inspectedFile, setInspectedFile] = useState<{
    path: string;
    label: string;
    status: string;
    summary: string;
    content: string;
    unitId?: string;
    branch: string;
  } | null>(null);

  // Resolved conflicts tracking
  const [resolvedConflictIds, setResolvedConflictIds] = useState<Set<string>>(new Set());
  const [resolutionNotice, setResolutionNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeTelemetry = telemetryEngine.subscribe((next) => setTelemetryState(next));
    const unsubscribeLedger = epistemicLedgerService.subscribe((next) => setLedgerData(next));

    void epistemicLedgerService.getLedger().then((next) => setLedgerData(next));

    return () => {
      unsubscribeTelemetry();
      unsubscribeLedger();
    };
  }, []);

  const completedCount = nodes.filter((node) => node.status === 'completed').length;
  const activeCount = nodes.filter((node) => node.status === 'active').length;
  const branchMeta = BRANCHES.find((branch) => branch.name === selectedBranch) || BRANCHES[0];

  // Dynamic commit history based on real actions, ledger facts, and telemetry
  const commitHistory = useMemo(() => {
    const factCommits = (ledgerData?.provenFacts ?? []).map((fact, index) => ({
      hash: fact.id ? fact.id.slice(-7) : `fct-${index + 100}`,
      label: `fact: ${fact.topic}`,
      author: fact.discoveredByAgent || 'Epistemic Engine',
      time: `${index + 1}h ago`,
      summary: fact.statement,
      branch: 'main',
      diff: [
        `+ confidence: ${Math.round((fact.confidence || 0.95) * 100)}%`,
        `+ layer: ${fact.layer || 'core'}`,
        `+ domain: ${fact.domain || 'general'}`,
      ],
    }));

    const signalCommits = (telemetryState.signals ?? []).map((signal, index) => ({
      hash: signal.id ? signal.id.slice(-7) : `sig-${index + 100}`,
      label: `telemetry: ${signal.type}`,
      author: 'Telemetry Engine',
      time: `${index + 1}m ago`,
      summary: signal.details,
      branch: 'research/debugging-loop',
      diff: [
        `+ severity: ${signal.severity}`,
        `+ subtopic: ${signal.subtopic || 'general'}`,
        `+ recorded_at: ${new Date(signal.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
      ],
    }));

    const pathCommits = nodes
      .filter((n) => n.status === 'completed')
      .map((node, index) => ({
        hash: `mod-${index + 101}`,
        label: `milestone: ${node.title}`,
        author: 'Learning OS Pipeline',
        time: `${index + 2}d ago`,
        summary: `Модуль освоен с итоговым баллом ${node.score || 100}%.`,
        branch: 'main',
        diff: [
          `+ score: ${node.score || 100}%`,
          `+ sprint: ${node.sprint || 'Sprint 1'}`,
          `+ status: verified`,
        ],
      }));

    if (selectedBranch === 'main') {
      return [...factCommits, ...pathCommits].slice(0, 15);
    }
    if (selectedBranch === 'research/debugging-loop') {
      return signalCommits.length > 0
        ? signalCommits.slice(0, 15)
        : [
            {
              hash: 'dbg-001',
              label: 'telemetry: baseline initialized',
              author: 'Telemetry Engine',
              time: 'just now',
              summary: 'Служба телеметрии работает в фоновом режиме, аномалий не обнаружено.',
              branch: 'research/debugging-loop',
              diff: ['+ telemetry_mode: active', '+ tracker: nominal'],
            },
          ];
    }
    // feature/personalized-path
    return [
      ...notes.map((n, i) => ({
        hash: `not-${i + 10}`,
        label: `note: ${n.title.slice(0, 25)}`,
        author: 'User Workspace',
        time: 'recently',
        summary: n.content.slice(0, 60) + '...',
        branch: 'feature/personalized-path',
        diff: [`+ tag: ${n.tag || 'general'}`],
      })),
      ...nodes
        .filter((n) => n.status === 'active')
        .map((n, i) => ({
          hash: `act-${i + 50}`,
          label: `active: ${n.title}`,
          author: 'Curriculum Orchestrator',
          time: 'in progress',
          summary: `Текущий активный фокус изучения (${n.phaseTitle || 'блок'}).`,
          branch: 'feature/personalized-path',
          diff: [`+ unit_id: ${n.unitId || n.id}`, `+ state: active`],
        })),
    ].slice(0, 15);
  }, [ledgerData, telemetryState, nodes, notes, selectedBranch]);

  // Real files in this branch with inspectable content
  const trackedKnowledge = useMemo(() => {
    if (selectedBranch === 'main') {
      return [
        ...nodes
          .filter((n) => n.status === 'completed')
          .map((n) => ({
            path: `knowledge/core/${formatPath(n.title)}.md`,
            label: n.title,
            status: 'committed' as const,
            summary: `Освоенный модуль. Инварианты зафиксированы. Итоговый балл: ${n.score || 100}%.`,
            unitId: n.unitId || n.id,
            content: `# ${n.title}\n\n## Статус\n- Состояние: Завершено\n- Результат: ${n.score || 100}%\n- Спринт: ${n.sprint || 'Sprint 1'}\n\n## Зафиксированные инварианты\n1. Базовые принципы темы подтверждены тестами.\n2. Логика решения проверена без подсказок.\n3. Модуль готов к промышленному применению.`,
          })),
        ...(ledgerData?.provenFacts ?? []).map((f) => ({
          path: `epistemic/facts/${formatPath(f.topic)}.json`,
          label: f.topic,
          status: 'staged' as const,
          summary: f.statement,
          unitId: undefined,
          content: `{\n  "topic": "${f.topic}",\n  "statement": "${f.statement}",\n  "confidence": ${f.confidence || 0.95},\n  "layer": "${f.layer || 'core'}",\n  "domain": "${f.domain || 'general'}",\n  "verified": true\n}`,
        })),
      ];
    }

    if (selectedBranch === 'feature/personalized-path') {
      return [
        ...notes.map((n) => ({
          path: `notes/${formatPath(n.title)}.txt`,
          label: n.title,
          status: 'modified' as const,
          summary: n.content.slice(0, 70),
          unitId: n.unitId,
          content: `# Заметка: ${n.title}\n\nТег: ${n.tag || 'общий'}\n\n${n.content}`,
        })),
        ...nodes
          .filter((n) => n.status === 'active')
          .map((n) => ({
            path: `curriculum/active/${formatPath(n.title)}.spec.ts`,
            label: n.title,
            status: 'staged' as const,
            summary: `В процессе прохождения. Порог сдачи: ${n.passingScore || 80}%.`,
            unitId: n.unitId || n.id,
            content: `// Active Curriculum Spec: ${n.title}\nexport const activeModule = {\n  id: "${n.id}",\n  title: "${n.title}",\n  passingScore: ${n.passingScore || 80},\n  phase: ${n.phase || 1},\n  phaseTitle: "${n.phaseTitle || 'Основы'}",\n  status: "active"\n};`,
          })),
      ];
    }

    // research/debugging-loop
    return [
      ...(telemetryState.signals ?? []).map((s, idx) => ({
        path: `telemetry/signals/signal-${idx + 1}-${s.type}.log`,
        label: `Signal: ${s.type}`,
        status: s.severity === 'high' ? ('conflict' as const) : ('staged' as const),
        summary: s.details,
        unitId: undefined,
        content: `TIMESTAMP: ${new Date(s.timestamp).toISOString()}\nTYPE: ${s.type}\nSEVERITY: ${s.severity}\nDETAILS: ${s.details}\nRECOMMENDATION: Рекомендуется повторить ключевые инварианты главы.`,
      })),
      ...artifacts
        .filter((a) => !a.passed)
        .map((a) => ({
          path: `artifacts/review/${a.filename}`,
          label: a.unitTitle || a.filename,
          status: 'conflict' as const,
          summary: `Артефакт не сдан (${a.score || 0}%). Требуется ревизия.`,
          unitId: a.unitId,
          content: `// Artifact Review: ${a.unitTitle || a.filename}\n// Filename: ${a.filename}\n// Score: ${a.score || 0}%\n// Status: FAILED\n\n${a.fileContent || '// Код требует доработки'}`,
        })),
    ];
  }, [selectedBranch, nodes, ledgerData, notes, telemetryState, artifacts]);

  const avgMastery = nodes.length > 0
    ? Math.round(
        nodes.reduce((acc, curr) => acc + (curr.score || (curr.status === 'completed' ? 100 : 0)), 0) /
          nodes.length
      )
    : 0;

  // Real merge conflicts with resolve capability
  const mergeConflicts = useMemo(() => {
    const conflicts: Array<{
      id: string;
      title: string;
      severity: 'low' | 'medium' | 'high';
      source: string;
      details: string;
      resolution: string;
    }> = [];

    const unresolvedConfusions = telemetryState.explicitConfusionFlags || [];
    if (unresolvedConfusions.length > 0 && !resolvedConflictIds.has('telemetry-confusion')) {
      conflicts.push({
        id: 'telemetry-confusion',
        title: 'Сигналы затруднения требуют адаптивного слияния',
        severity: 'high',
        source: 'Telemetry Engine',
        details: `Зафиксировано ${unresolvedConfusions.length} сигналов сомнения (${unresolvedConfusions.slice(0, 2).join(', ')}).`,
        resolution: 'Слить поясняющий инвариант в ветку personal path и снять флаг затруднения.',
      });
    }

    const failedArtifacts = artifacts.filter((a) => !a.passed);
    if (failedArtifacts.length > 0 && !resolvedConflictIds.has('artifact-rework')) {
      conflicts.push({
        id: 'artifact-rework',
        title: 'Артефакты требуют ревизии перед слиянием в main',
        severity: 'medium',
        source: 'Artifact Review',
        details: `Файл «${failedArtifacts[0].filename}» не прошёл порог зачёта (${failedArtifacts[0].score || 0}%).`,
        resolution: 'Объединить исправления кода и перезапустить проверку артефакта.',
      });
    }

    const activeNodes = nodes.filter((n) => n.status === 'active');
    if (activeNodes.length > 0 && !resolvedConflictIds.has('branch-priority')) {
      conflicts.push({
        id: 'branch-priority',
        title: 'Несинхронизированные активные модули',
        severity: selectedBranch === 'feature/personalized-path' ? 'medium' : 'low',
        source: 'Curriculum Planner',
        details: `Активный модуль «${activeNodes[0].title}» находится в процессе изучения.`,
        resolution: 'Зафиксировать промежуточный прогресс в ветке personal path.',
      });
    }

    return conflicts;
  }, [telemetryState, artifacts, nodes, selectedBranch, resolvedConflictIds]);

  const handleResolveConflict = (conflictId: string, resolutionTitle: string) => {
    setResolvedConflictIds((prev) => new Set([...prev, conflictId]));
    playChime('success');
    setResolutionNotice(`Конфликт «${resolutionTitle}» успешно разрешён и слит в контекст.`);
    setTimeout(() => setResolutionNotice(null), 4000);

    // Record crystallization in ledger
    void epistemicLedgerService.synthesizeCoreNode({
      title: `Слияние: ${resolutionTitle}`,
      subtitle: 'Разрешённый конфликт ветвления',
      layer: 'mantle',
      domain: 'Архитектура знаний',
      description: `Конфликт ветки ${selectedBranch} успешно разрешён и синхронизирован с основным ядром знаний.`,
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#F8F9FA] text-[#202124] overflow-hidden select-none">
      {/* Top Header - Google Cloud Console / Developer Style */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-[#DADCE0] bg-white shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#E8F0FE] text-[#1A73E8]">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#5F6368] font-medium">Knowledge Git</div>
            <div className="text-sm font-semibold text-[#202124]">Репозиторий учебных знаний</div>
          </div>
        </div>

        {/* Branch Selector (Google Segmented Buttons / Chips) */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap justify-end">
          {BRANCHES.map((branch) => {
            const isSelected = selectedBranch === branch.name;
            return (
              <button
                key={branch.name}
                type="button"
                onClick={() => {
                  setSelectedBranch(branch.name);
                  playChime('click');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#1A73E8]/40 shadow-xs'
                    : 'bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4] hover:text-[#202124]'
                }`}
                title={branch.desc}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>{branch.name}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Metrics Row (Google Cards Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-[#DADCE0] bg-white shrink-0">
        <div className="rounded-xl border border-[#DADCE0] bg-[#FFFFFF] p-3.5 shadow-none">
          <div className="flex items-center justify-between text-xs text-[#5F6368]">
            <span>Зафиксировано</span>
            <CheckCircle2 className="w-4 h-4 text-[#1E8E3E]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#202124]">{completedCount}</div>
          <div className="text-[11px] text-[#5F6368]">освоенных модулей</div>
        </div>

        <div className="rounded-xl border border-[#DADCE0] bg-[#FFFFFF] p-3.5 shadow-none">
          <div className="flex items-center justify-between text-xs text-[#5F6368]">
            <span>В разработке</span>
            <Layers className="w-4 h-4 text-[#1A73E8]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#202124]">{activeCount}</div>
          <div className="text-[11px] text-[#5F6368]">активных веток</div>
        </div>

        <div className="rounded-xl border border-[#DADCE0] bg-[#FFFFFF] p-3.5 shadow-none">
          <div className="flex items-center justify-between text-xs text-[#5F6368]">
            <span>Качество знаний</span>
            <Database className="w-4 h-4 text-[#8430CE]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#202124]">{avgMastery}%</div>
          <div className="text-[11px] text-[#5F6368]">средний балл курса</div>
        </div>

        <div className="rounded-xl border border-[#DADCE0] bg-[#FFFFFF] p-3.5 shadow-none">
          <div className="flex items-center justify-between text-xs text-[#5F6368]">
            <span>Аксиомы реестра</span>
            <Sparkles className="w-4 h-4 text-[#E37400]" />
          </div>
          <div className="mt-1 text-2xl font-bold text-[#202124]">{ledgerData?.provenFacts?.length ?? 0}</div>
          <div className="text-[11px] text-[#5F6368]">доказанных фактов</div>
        </div>
      </div>

      {resolutionNotice && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] text-xs flex items-center justify-between">
          <span>{resolutionNotice}</span>
          <button type="button" onClick={() => setResolutionNotice(null)} className="p-1 hover:bg-[#CEEAD6] rounded text-[#137333]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Split: Git Commit History & Change Set */}
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.5fr] flex-1 min-h-0 p-4 gap-4 overflow-hidden">
        {/* Left Column: Commit Log */}
        <div className="rounded-xl border border-[#DADCE0] bg-white p-4 overflow-hidden flex flex-col shadow-none">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#DADCE0] shrink-0">
            <div className="flex items-center space-x-2 text-sm font-semibold text-[#202124]">
              <GitCommitHorizontal className="w-4 h-4 text-[#1E8E3E]" />
              <span>История коммитов ({commitHistory.length})</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#5F6368] font-mono font-medium">
              {branchMeta.label}
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
            {commitHistory.map((commit, idx) => (
              <div key={`${commit.hash}-${idx}`} className="rounded-lg border border-[#DADCE0] bg-white p-3 hover:bg-[#F8F9FA] transition space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#5F6368] font-mono">
                  <span className="text-[#1A73E8] font-bold bg-[#E8F0FE] px-1.5 py-0.5 rounded text-[11px]">{commit.hash}</span>
                  <span>{commit.time}</span>
                </div>
                <div className="text-sm font-semibold text-[#202124] leading-snug">{commit.label}</div>
                <div className="text-xs text-[#5F6368] leading-relaxed">{commit.summary}</div>
                <div className="text-[11px] text-[#80868B]">Автор: {commit.author}</div>
                {commit.diff && commit.diff.length > 0 && (
                  <div className="pt-1.5 border-t border-[#F1F3F4] space-y-0.5 font-mono text-[11px] text-[#137333]">
                    {commit.diff.map((line, dIdx) => (
                      <div key={dIdx}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Change Set / File Tree with Built-in File Inspector */}
        <div className="rounded-xl border border-[#DADCE0] bg-white p-4 overflow-hidden flex flex-col shadow-none">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#DADCE0] shrink-0">
            <div className="flex items-center space-x-2 text-sm font-semibold text-[#202124]">
              <FileText className="w-4 h-4 text-[#1A73E8]" />
              <span>Файлы ветки ({trackedKnowledge.length})</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#5F6368] font-mono">
              Нажмите для просмотра
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {trackedKnowledge.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5F6368]">
                В этой ветке нет изменённых файлов
              </div>
            ) : (
              trackedKnowledge.map((item, index) => (
                <button
                  key={`${item.path}-${index}`}
                  type="button"
                  onClick={() => {
                    setInspectedFile({
                      path: item.path,
                      label: item.label,
                      status: item.status,
                      summary: item.summary,
                      content: item.content,
                      unitId: item.unitId,
                      branch: selectedBranch,
                    });
                    playChime('click');
                  }}
                  className="w-full text-left rounded-lg border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] transition p-3 cursor-pointer flex flex-col space-y-1.5 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          item.status === 'staged'
                            ? 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]'
                            : item.status === 'modified'
                            ? 'bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]'
                            : item.status === 'committed'
                            ? 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]'
                            : 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-[#5F6368] font-mono truncate">{item.path}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#80868B] group-hover:text-[#1A73E8]">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[#202124]">{item.label}</div>
                  <div className="text-xs text-[#5F6368] leading-relaxed">{item.summary}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Merge Conflicts & Status Bar */}
      <footer className="border-t border-[#DADCE0] bg-white px-5 py-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#5F6368] uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-[#E37400]" />
            <span>Контроль слияния и разрешение конфликтов ({mergeConflicts.length})</span>
          </div>
          <div className="text-xs text-[#5F6368] font-mono">
            Ветка: {selectedBranch} • Telemetry Sync: Live
          </div>
        </div>

        {mergeConflicts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mergeConflicts.map((conflict) => (
              <div key={conflict.id} className="rounded-lg border border-[#DADCE0] bg-[#F8F9FA] p-3 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-[#202124]">{conflict.title}</div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        conflict.severity === 'high'
                          ? 'bg-[#FCE8E6] text-[#C5221F]'
                          : conflict.severity === 'medium'
                          ? 'bg-[#FEF7E0] text-[#B06000]'
                          : 'bg-[#E6F4EA] text-[#137333]'
                      }`}
                    >
                      {conflict.severity}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] uppercase font-mono text-[#5F6368]">{conflict.source}</div>
                  <div className="mt-1 text-xs text-[#5F6368] leading-relaxed">{conflict.details}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleResolveConflict(conflict.id, conflict.title)}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#E6F4EA] hover:bg-[#CEEAD6] border border-[#CEEAD6] text-[#137333] font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Разрешить и слить</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1E8E3E]" />
            <span>Все ветки синхронизированы без конфликтов. Знания согласованы.</span>
          </div>
        )}
      </footer>

      {/* Built-in File Inspector Modal (Clean Google Dialog) */}
      {inspectedFile && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] bg-white border border-[#DADCE0] rounded-2xl shadow-xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DADCE0] bg-white">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-[#1A73E8]" />
                <div>
                  <div className="text-sm font-bold text-[#202124]">{inspectedFile.label}</div>
                  <div className="text-xs font-mono text-[#5F6368]">{inspectedFile.path}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedFile(null)}
                className="p-1.5 rounded-full text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3 bg-[#F8F9FA]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#E8F0FE] border border-[#D2E3FC] text-[#1A73E8] text-xs font-mono">
                  {inspectedFile.status}
                </span>
                <span className="text-xs text-[#5F6368]">
                  Ветка: <span className="font-mono text-[#202124] font-medium">{inspectedFile.branch}</span>
                </span>
              </div>

              <div className="rounded-xl border border-[#DADCE0] bg-white p-4 font-mono text-xs text-[#202124] whitespace-pre-wrap leading-relaxed select-text shadow-none">
                {inspectedFile.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#DADCE0] bg-white flex items-center justify-between">
              {inspectedFile.unitId && onLaunchUnit ? (
                <button
                  type="button"
                  onClick={() => {
                    const unitId = inspectedFile.unitId!;
                    setInspectedFile(null);
                    onLaunchUnit(unitId);
                  }}
                  className="px-4 py-2 rounded-full bg-[#1A73E8] hover:bg-[#1765CC] text-white text-xs font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Открыть этот модуль в курсе</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setInspectedFile(null)}
                className="px-4 py-2 rounded-full border border-[#DADCE0] hover:bg-[#F1F3F4] text-[#3C4043] text-xs font-medium transition cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
