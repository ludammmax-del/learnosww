import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Check, 
  X, 
  RotateCw, 
  Search, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  EyeOff, 
  Calculator,
  ShieldAlert,
  Upload,
  Video,
  FileText,
  Edit3,
  Save,
  Plus,
  Film,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Code2
} from 'lucide-react';
import { AdminUnitRow, AdminMaterial } from '../../types.ts';
import { INITIAL_ADMIN_MATERIALS } from '../../data/initialData.ts';
import { playChime } from '../../utils/audio.ts';

interface AdminConsoleWindowProps {
  units: AdminUnitRow[];
  onUpdateUnit: (updated: AdminUnitRow[]) => void;
  materials?: AdminMaterial[];
  onUpdateMaterials?: (materials: AdminMaterial[]) => void;
  onDeployMaterialToCourse?: (material: AdminMaterial, compiledPractice?: any) => void;
  initialTab?: 'queue' | 'matrix' | 'royalties' | 'store';
  highlightMaterialId?: string | null;
}

export const AdminConsoleWindow: React.FC<AdminConsoleWindowProps> = ({ 
  units, 
  onUpdateUnit,
  materials = INITIAL_ADMIN_MATERIALS,
  onUpdateMaterials,
  onDeployMaterialToCourse,
  initialTab,
  highlightMaterialId,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'matrix' | 'royalties' | 'store'>(initialTab || 'store');
  const [selectedQueueUnit, setSelectedQueueUnit] = useState<AdminUnitRow>(units[2] || units[0]);
  const [authorPool, setAuthorPool] = useState(18450);

  // Material Store State
  const [materialFilter, setMaterialFilter] = useState<'all' | 'video' | 'presentation' | 'file' | 'text'>('all');
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isPdfDistillModalOpen, setIsPdfDistillModalOpen] = useState(false);
  const [isDistillingPdf, setIsDistillingPdf] = useState(false);
  const [pdfUploadStatus, setPdfUploadStatus] = useState<string>('');
  const [distilledPdfResult, setDistilledPdfResult] = useState<any | null>(null);
  const [compilingMaterialId, setCompilingMaterialId] = useState<string | null>(null);
  const [compiledPractices, setCompiledPractices] = useState<Record<string, { quiz: any[]; projectTask: any }>>({});
  const [deployedMaterialIds, setDeployedMaterialIds] = useState<Set<string>>(new Set(['mat-vid-1']));
  const [activeHighlightedId, setActiveHighlightedId] = useState<string | null>(highlightMaterialId || null);
  const [previewingVideoId, setPreviewingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (highlightMaterialId) {
      setActiveTab('store');
      setMaterialFilter('all');
      setActiveHighlightedId(highlightMaterialId);
      setTimeout(() => {
        const el = document.getElementById(`store-mat-${highlightMaterialId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [highlightMaterialId]);

  // Add Material Form fields
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<'video' | 'presentation' | 'file' | 'text'>('video');
  const [matAuthor, setMatAuthor] = useState('@expert_author');
  const [matDomain, setMatDomain] = useState('Универсальные навыки & Мастерство');
  const [matLevel, setMatLevel] = useState<'beginner' | 'intermediate' | 'master'>('intermediate');
  const [matContentUrl, setMatContentUrl] = useState('');
  const [matTextContent, setMatTextContent] = useState('');
  const [matAiEssence, setMatAiEssence] = useState('');
  const [matAiPracticeGuidelines, setMatAiPracticeGuidelines] = useState('');

  const handleOpenAddMaterialModal = () => {
    setMatTitle('');
    setMatType('video');
    setMatAuthor('@expert_author');
    setMatDomain('Универсальные навыки & Мастерство');
    setMatLevel('intermediate');
    setMatContentUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setMatTextContent('');
    setMatAiEssence('');
    setMatAiPracticeGuidelines('');
    setIsAddMaterialModalOpen(true);
    playChime('click');
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim() || !matAiEssence.trim()) return;

    const newMat: AdminMaterial = {
      id: `mat-${matType.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      title: matTitle.trim(),
      type: matType,
      author: matAuthor.trim() || '@author',
      domain: matDomain,
      level: matLevel,
      contentUrl: matContentUrl.trim() || undefined,
      textContent: matTextContent.trim() || undefined,
      aiEssence: matAiEssence.trim(),
      aiPracticeGuidelines: matAiPracticeGuidelines.trim() || 'Составить глубокий инженерный тест и практический проект по теме материала.',
      viewsCount: 150,
      createdAt: 'Только что',
      status: 'approved',
    };

    const updated = [newMat, ...materials];
    if (onUpdateMaterials) onUpdateMaterials(updated);
    setIsAddMaterialModalOpen(false);
    playChime('success');
  };

  const handleDistillPdfFile = async (file: File) => {
    if (!file) return;
    setIsDistillingPdf(true);
    setPdfUploadStatus(`Чтение файла «${file.name}»...`);
    playChime('click');

    try {
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        if (file.name.endsWith('.pdf')) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });

      const fileData = await fileDataPromise;
      setPdfUploadStatus('Проверка кэша Firebase и дистилляция сути ИИ...');

      const payload = file.name.endsWith('.pdf')
        ? { fileBase64: fileData, filename: file.name, domain: matDomain, targetLevel: matLevel }
        : { rawText: fileData, filename: file.name, domain: matDomain, targetLevel: matLevel };

      const res = await fetch('/api/pdf/distill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Distillation failed');
      const json = await res.json();
      if (json.success && json.essence) {
        setDistilledPdfResult(json.essence);
        setPdfUploadStatus(json.cachedInFirestore ? '⚡ Извлечено из кэша Firebase!' : '✨ Дистиллировано и сохранено в Firebase!');
        playChime('success');
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err: any) {
      console.warn('PDF Distill error:', err);
      setPdfUploadStatus('Ошибка дистилляции. Проверьте формат файла.');
    } finally {
      setIsDistillingPdf(false);
    }
  };

  const handleApplyDistilledPdf = () => {
    if (!distilledPdfResult) return;

    const newMat: AdminMaterial = {
      id: `mat-pdf-${Date.now().toString().slice(-5)}`,
      title: distilledPdfResult.title || 'Дистиллированный материал',
      type: 'file',
      author: distilledPdfResult.authorOrSource || '@academic_distiller',
      domain: distilledPdfResult.domain || 'Инженерия & Системы',
      level: matLevel,
      textContent: distilledPdfResult.coreTheoriesMarkdown || distilledPdfResult.summary,
      aiEssence: `[Инварианты]: ${(distilledPdfResult.keyInvariants || []).join('; ')}\n\n[Выжимка]: ${distilledPdfResult.summary}`,
      aiPracticeGuidelines: 'Проверить понимание ключевых инвариантов и реализовать практическое решение.',
      viewsCount: 220,
      createdAt: 'Только что',
      status: 'approved',
    };

    const firstModule = distilledPdfResult.structuredModules?.[0];
    if (firstModule) {
      setCompiledPractices((prev) => ({
        ...prev,
        [newMat.id]: {
          quiz: [
            {
              id: `q-distill-1`,
              type: 'logic',
              question: firstModule.quizQuestion?.question || `В чем суть темы «${distilledPdfResult.title}»?`,
              options: (firstModule.quizQuestion?.options || []).map((opt: string, idx: number) => ({
                id: `opt-${idx + 1}`,
                text: opt,
                isCorrect: idx === (firstModule.quizQuestion?.correctIndex || 0),
                explanation: firstModule.quizQuestion?.explanation || 'Обоснование верности ответа.'
              })),
              explanation: firstModule.quizQuestion?.explanation || 'Разбор инварианта.',
            }
          ],
          projectTask: {
            title: firstModule.practicalExercise?.title || `Практика: ${distilledPdfResult.title}`,
            role: 'Практик & Архитектор',
            description: firstModule.practicalExercise?.instruction || firstModule.practicalExercise?.scenario || 'Реализуйте решение по дистиллированным инвариантам.',
            requirements: firstModule.practicalExercise?.criteria || ['Соблюдение инвариантов', 'Обработка краевых случаев'],
            defaultFilename: 'practice-solution.md',
            starterCode: firstModule.practicalExercise?.starterTemplate || '# Решение практического задания\n'
          }
        }
      }));
    }

    const updated = [newMat, ...materials];
    if (onUpdateMaterials) onUpdateMaterials(updated);

    setIsPdfDistillModalOpen(false);
    setDistilledPdfResult(null);
    playChime('success');
  };

  const handleCompilePractice = async (mat: AdminMaterial) => {
    setCompilingMaterialId(mat.id);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/compile-practice-from-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialTitle: mat.title,
          materialType: mat.type,
          theoryText: mat.textContent || mat.aiEssence,
          aiEssence: mat.aiEssence,
          domain: mat.domain,
          level: mat.level,
        }),
      });

      if (!res.ok) throw new Error('Compile failed');
      const data = await res.json();
      setCompiledPractices((prev) => ({ ...prev, [mat.id]: data }));
      playChime('success');
    } catch (err) {
      console.warn('Compile practice failed, generating local fallback:', err);
      setCompiledPractices((prev) => ({
        ...prev,
        [mat.id]: {
          quiz: [
            {
              id: 'q-comp-1',
              type: 'trade_off',
              question: `Какой компромисс является ключевым при реализации темы «${mat.title}»?`,
              scenario: `Контекст от администратора: ${mat.aiEssence}`,
              options: [
                {
                  id: 'o1',
                  text: 'Строгое соблюдение формата структуры данных и отказ от оверхеда избыточных оберток.',
                  isCorrect: true,
                  explanation: 'Верно. Обеспечивает производительность и устойчивость под нагрузкой.',
                },
                {
                  id: 'o2',
                  text: 'Игнорирование ограничений памяти ради быстроты прототипа.',
                  isCorrect: false,
                  explanation: 'Приводит к аварийным завершениям сервиса под нагрузкой.',
                },
              ],
              explanation: 'Соблюдение архитектурных компромиссов.',
            },
          ],
          projectTask: {
            title: `Практический артефакт: ${mat.title}`,
            role: mat.level === 'beginner' ? 'Junior Specialist' : 'Lead Architect',
            description: `Реализуйте решение по материалам темы «${mat.title}». Суть от администратора: ${mat.aiEssence}`,
            requirements: [
              'Соблюдение контракта интерфейса и чистота кода',
              'Обработка краевых сценариев и ошибок ввода',
              'Отсутствие критических уязвимостей',
            ],
            defaultFilename: `${mat.title.toLowerCase().replace(/[^a-z0-9]/gi, '_') || 'solution'}.py`,
            starterCode: `# Практическая работа по теме: ${mat.title}\n# Суть от админа: ${mat.aiEssence}\n\ndef execute_solution():\n    return {"status": "SUCCESS", "module": "${mat.title}"}\n\nif __name__ == "__main__":\n    print(execute_solution())\n`,
          },
        },
      }));
      playChime('success');
    } finally {
      setCompilingMaterialId(null);
    }
  };

  const handleDeployToCourse = (mat: AdminMaterial) => {
    const compiled = compiledPractices[mat.id];
    if (onDeployMaterialToCourse) {
      onDeployMaterialToCourse(mat, compiled);
    }
    setDeployedMaterialIds((prev) => new Set([...prev, mat.id]));
    playChime('success');
  };

  // Video Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newDomain, setNewDomain] = useState('Универсальные навыки & Мастерство');
  const [newLevel, setNewLevel] = useState<'beginner' | 'intermediate' | 'master'>('intermediate');
  const [newDurationMin, setNewDurationMin] = useState(30);
  const [newVideoUrl, setNewVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [newDetailedDescription, setNewDetailedDescription] = useState('');

  // In-place description editing
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [editDescriptionText, setEditDescriptionText] = useState('');

  const handleOpenUploadModal = () => {
    setNewTitle('');
    setNewAuthor('@senior_expert');
    setNewDomain('Универсальные навыки & Мастерство');
    setNewLevel('intermediate');
    setNewDurationMin(35);
    setNewVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setNewDetailedDescription('');
    setIsUploadModalOpen(true);
    playChime('click');
  };

  const handleSaveUploadedVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDetailedDescription.trim()) return;

    const newUnit: AdminUnitRow = {
      id: `unit-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      author: newAuthor.trim() || '@author',
      views: 1200,
      retention: 94,
      passRate: 91,
      boostFactor: 1.4,
      status: 'approved',
      screeningFlags: [],
      termDensity: 0.94,
      waterPercentage: 5,
      detailedDescription: newDetailedDescription.trim(),
      videoUrl: newVideoUrl.trim() || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      domain: newDomain,
      level: newLevel,
      durationMin: newDurationMin,
    };

    const updated = [newUnit, ...units];
    onUpdateUnit(updated);
    setSelectedQueueUnit(newUnit);
    setIsUploadModalOpen(false);
    playChime('success');
  };

  const handleStartEditDescription = (unit: AdminUnitRow) => {
    setEditingDescriptionId(unit.id);
    setEditDescriptionText(unit.detailedDescription || '');
  };

  const handleSaveDescription = (unitId: string) => {
    const updated = units.map((u) => u.id === unitId ? { ...u, detailedDescription: editDescriptionText.trim() } : u);
    onUpdateUnit(updated);
    if (selectedQueueUnit?.id === unitId) {
      setSelectedQueueUnit({ ...selectedQueueUnit, detailedDescription: editDescriptionText.trim() });
    }
    setEditingDescriptionId(null);
    playChime('success');
  };

  // Ingestion Queue actions
  const handleApproveUnit = (id: string) => {
    const updated = units.map((u) => u.id === id ? { ...u, status: 'approved' as const, boostFactor: 1.2 } : u);
    onUpdateUnit(updated);
    playChime('success');
  };

  const handleDemoteOrReject = (id: string) => {
    const updated = units.map((u) => u.id === id ? { ...u, status: 'flagged' as const, boostFactor: 0.2 } : u);
    onUpdateUnit(updated);
    playChime('alert');
  };

  const handlePromote = (id: string) => {
    const updated = units.map((u) => u.id === id ? { ...u, boostFactor: Math.min(2.0, +(u.boostFactor + 0.2).toFixed(1)) } : u);
    onUpdateUnit(updated);
    playChime('click');
  };

  const handleDemote = (id: string) => {
    const updated = units.map((u) => u.id === id ? { ...u, boostFactor: Math.max(0.1, +(u.boostFactor - 0.2).toFixed(1)) } : u);
    onUpdateUnit(updated);
    playChime('click');
  };

  const handleSunset = (id: string) => {
    const updated = units.map((u) => u.id === id ? { ...u, status: 'sunset' as const, boostFactor: 0 } : u);
    onUpdateUnit(updated);
    playChime('click');
  };

  // Royalties calculation
  const totalViews = units.reduce((acc, u) => acc + u.views, 0) || 1;
  const totalPass = units.reduce((acc, u) => acc + u.passRate, 0) || 1;

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-2xl text-slate-800 text-xs select-none">
      {/* Metrics Top Header */}
      <div className="h-12 border-b border-slate-200/80 px-5 flex items-center justify-between bg-white/80 backdrop-blur-xl shrink-0 shadow-2xs">
        <div className="flex items-center space-x-5">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-slate-900" />
            <div>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Admin Control Plane</h3>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3 text-xs text-slate-500 pl-4 border-l border-slate-200/80 font-medium">
            <span>Модулей: <strong className="text-slate-800 font-mono">1,420</strong></span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Авторов: <strong className="text-slate-800 font-mono">218</strong></span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>P2P: <strong className="text-slate-800 font-mono">840</strong></span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Пул: <strong className="text-slate-900 font-mono">${authorPool.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Tab Switcher & Upload Action */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 text-xs shadow-2xs gap-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                activeTab === 'queue' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Входящая очередь
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                activeTab === 'matrix' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Матрица контента
            </button>
            <button
              onClick={() => setActiveTab('royalties')}
              className={`px-3 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                activeTab === 'royalties' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Роялти
            </button>
            <button
              onClick={() => setActiveTab('store')}
              className={`px-3 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                activeTab === 'store' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Магазин материалов
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="btn-admin-add-store-material"
              onClick={handleOpenAddMaterialModal}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center space-x-1.5 transition text-xs cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить в магазин</span>
            </button>

            <button
              type="button"
              id="btn-admin-upload-video"
              onClick={handleOpenUploadModal}
              className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 font-semibold flex items-center space-x-1.5 transition text-xs cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Загрузить видео</span>
            </button>
          </div>
        </div>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto p-4 select-text bg-white/30 backdrop-blur-md">
        {/* TAB 1: INGESTION QUEUE */}
        {activeTab === 'queue' && (
          <div className="grid lg:grid-cols-3 gap-4 h-full">
            {/* Queue List */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.05)] space-y-2 overflow-y-auto max-h-[520px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Материалы на модерации (4 ступени)
              </div>
              {units.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedQueueUnit(u)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedQueueUnit?.id === u.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white/80 border-white/90 text-slate-700 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-[10px] ${selectedQueueUnit?.id === u.id ? 'text-slate-300' : 'text-slate-500'}`}>#{u.id}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      u.status === 'approved' 
                        ? (selectedQueueUnit?.id === u.id ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                        : u.status === 'flagged' 
                        ? (selectedQueueUnit?.id === u.id ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40' : 'bg-rose-50 text-rose-700 border border-rose-200') 
                        : (selectedQueueUnit?.id === u.id ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-amber-50 text-amber-700 border border-amber-200')
                    }`}>
                      {u.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className={`font-bold text-xs mt-1 truncate ${selectedQueueUnit?.id === u.id ? 'text-white' : 'text-slate-900'}`}>{u.title}</h4>
                  <div className={`flex items-center justify-between text-[11px] mt-2 ${selectedQueueUnit?.id === u.id ? 'text-slate-300' : 'text-slate-500'}`}>
                    <span>{u.author}</span>
                    <span>Вода: {u.waterPercentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Screening Inspector */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.05)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-[10px] text-slate-500 font-medium">
                    #{selectedQueueUnit.id} • {selectedQueueUnit.author}
                  </span>
                  <h3 className="font-semibold text-sm text-slate-900 mt-0.5">
                    {selectedQueueUnit.title}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500">Плотность терминов:</span>
                  <span className="text-xs font-semibold text-emerald-600 font-mono">
                    {(selectedQueueUnit.termDensity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Whisper STT Screening Flags */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Результаты автоматического скрининга (Whisper STT + Векторная база):</span>
                </div>

                {selectedQueueUnit.screeningFlags.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedQueueUnit.screeningFlags.map((flag, idx) => (
                      <div key={idx} className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg text-xs flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Нарушений Конституции платформы не выявлено. Высокая терминологическая плотность, отсутствие внешних воронок и обещаний заработка.</span>
                  </div>
                )}
              </div>

              {/* Vector Comparator */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <div className="font-medium text-slate-900 flex items-center justify-between">
                  <span>Векторный компаратор дубликатов (Qdrant):</span>
                  <span className="text-sky-700 font-mono">14% семантического пересечения</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Материал оригинален. Уникальные схемы объяснения, отсутствие копирования существующих конспектов других авторов.
                </p>
              </div>

              {/* AI Ingestion & Detailed Description by Admin */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>Подробное описание от админа (считывается ИИ):</span>
                  </div>
                  {editingDescriptionId !== selectedQueueUnit.id ? (
                    <button
                      type="button"
                      onClick={() => handleStartEditDescription(selectedQueueUnit)}
                      className="text-[11px] text-slate-700 hover:text-slate-900 flex items-center space-x-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 cursor-pointer shadow-2xs font-medium"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Редактировать описание</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSaveDescription(selectedQueueUnit.id)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 bg-white px-2.5 py-1 rounded-md border border-emerald-300 font-medium cursor-pointer shadow-2xs"
                    >
                      <Save className="w-3 h-3" />
                      <span>Сохранить для ИИ</span>
                    </button>
                  )}
                </div>

                {editingDescriptionId === selectedQueueUnit.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editDescriptionText}
                      onChange={(e) => setEditDescriptionText(e.target.value)}
                      rows={4}
                      className="w-full bg-white text-slate-900 p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans leading-relaxed"
                      placeholder="Укажите подробно: о чем видео, ключевые концепции, термины, схемы, что решает..."
                    />
                    <div className="text-[11px] text-slate-500">
                      ИИ изучает это описание и решает, подходит ли видео в траекторию студента или синтезировать новый блок.
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 text-xs leading-relaxed bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
                    {selectedQueueUnit.detailedDescription || 'Описание от админа еще не заполнено. Нажмите «Редактировать описание», чтобы ИИ мог считывать суть видео и встраивать его в траектории.'}
                  </p>
                )}
              </div>

              {/* Verdict Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  Регламент: Одобрение начисляет грант $5 из фонда Cold Start.
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDemoteOrReject(selectedQueueUnit.id)}
                    className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium transition cursor-pointer"
                  >
                    Отклонить с шаблоном
                  </button>
                  <button
                    onClick={() => handleApproveUnit(selectedQueueUnit.id)}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-2xs transition cursor-pointer"
                  >
                    Одобрить + $5 фикса
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTENT PERFORMANCE MATRIX */}
        {activeTab === 'matrix' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Матрица ранжирования фонда знаний</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Ручная коррекция весов для ИИ-оркестратора при сборке графов (DAG)
                </p>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-[11px]">
                  <th className="p-3 pl-4">ID</th>
                  <th className="p-3">Заголовок модуля</th>
                  <th className="p-3">Автор</th>
                  <th className="p-3">Просмотры</th>
                  <th className="p-3">Удержание</th>
                  <th className="p-3">Тест Pass%</th>
                  <th className="p-3">Буст-фактор</th>
                  <th className="p-3 pr-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 pl-4 font-mono text-slate-400">#{u.id}</td>
                    <td className="p-3 font-medium text-slate-900 max-w-xs truncate">{u.title}</td>
                    <td className="p-3 text-slate-600">{u.author}</td>
                    <td className="p-3 font-mono text-slate-700">{u.views.toLocaleString()}</td>
                    <td className="p-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        u.retention >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {u.retention}%
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        u.passRate >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {u.passRate}%
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-900">{u.boostFactor}x</td>
                    <td className="p-3 pr-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handlePromote(u.id)}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 transition text-[11px] font-medium shadow-2xs cursor-pointer"
                        title="Повысить приоритет при генерации графов"
                      >
                        Promote
                      </button>
                      <button
                        onClick={() => handleDemote(u.id)}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 transition text-[11px] font-medium shadow-2xs cursor-pointer"
                        title="Понизить приоритет"
                      >
                        Demote
                      </button>
                      <button
                        onClick={() => handleSunset(u.id)}
                        className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 rounded border border-rose-200 transition text-[11px] font-medium shadow-2xs cursor-pointer"
                        title="Вывести из эксплуатации (Sunset)"
                      >
                        Sunset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: ROYALTIES DISPATCHER */}
        {activeTab === 'royalties' && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.05)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Математическая модель распределения финансов
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5 font-mono">
                    Royalty = AuthorPool × [ 0.4 × (WatchTime / ΣWatchTime) + 0.6 × (PassRate / ΣPassRate) ]
                  </p>
                </div>

                <div className="flex items-center space-x-2 bg-white/70 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-slate-500 font-medium">Пул ($):</span>
                  <input
                    type="number"
                    value={authorPool}
                    onChange={(e) => setAuthorPool(Number(e.target.value) || 0)}
                    className="w-24 bg-transparent font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Author Royalty Calculation Cards */}
              <div className="grid md:grid-cols-2 gap-3">
                {units.map((u) => {
                  const watchWeight = (u.views / totalViews) * 0.4;
                  const passWeight = (u.passRate / totalPass) * 0.6;
                  const royaltyEarned = Math.round(authorPool * (watchWeight + passWeight));

                  return (
                    <div key={u.id} className="bg-white/70 p-4 rounded-xl border border-white/90 space-y-2 shadow-2xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{u.author}</div>
                          <div className="text-slate-500 text-[11px] truncate max-w-xs">{u.title}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-700 font-mono">
                            ${royaltyEarned.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-400">начислено</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                        <span>Удержание: {u.retention}%</span>
                        <span>Усвоение: {u.passRate}%</span>
                        <span className="text-emerald-700 font-semibold">Верифицировано</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Anti-fraud banner */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex items-center space-x-3 text-slate-700 text-xs">
                <ShieldAlert className="w-5 h-5 text-slate-600 shrink-0" />
                <span>
                  Защита от фрода активна: накрутка просмотров с одинаковых IP-подсетей и пустых профилей автоматически изолируется и не допускается к пулу выплат.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MATERIAL STORE & AI PRACTICE COMPILER */}
        {activeTab === 'store' && (
          <div className="space-y-4">
            {/* Store Header Banner */}
            <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded-lg bg-slate-900 text-white">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">
                    Магазин материалов & AI Practice Generator
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Администраторы загружают исходные материалы (видео, презентации, файлы, текст) и <strong className="text-slate-900 font-semibold">записывают суть для ИИ</strong>. ИИ опирается на них, понимает когда и какому ученику выдать материал, и <strong className="text-slate-900 font-semibold">автоматически составляет практику</strong> (экспресс-тест и проект).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPdfDistillModalOpen(true);
                    setDistilledPdfResult(null);
                    setPdfUploadStatus('');
                    playChime('click');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📄 Дистиллировать PDF / Книгу</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddMaterialModal}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить материал</span>
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1 bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setMaterialFilter('all')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                    materialFilter === 'all' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Все ({materials.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialFilter('video')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-medium transition flex items-center space-x-1 cursor-pointer ${
                    materialFilter === 'video' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>Видео</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialFilter('presentation')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-medium transition flex items-center space-x-1 cursor-pointer ${
                    materialFilter === 'presentation' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>Презентации</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialFilter('file')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-medium transition flex items-center space-x-1 cursor-pointer ${
                    materialFilter === 'file' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="w-3 h-3" />
                  <span>Файлы/Код</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialFilter('text')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-medium transition flex items-center space-x-1 cursor-pointer ${
                    materialFilter === 'text' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Текст</span>
                </button>
              </div>
            </div>

            {/* Materials Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {materials
                .filter((m) => materialFilter === 'all' || m.type === materialFilter)
                .map((mat) => {
                  const compiled = compiledPractices[mat.id];
                  const isCompiling = compilingMaterialId === mat.id;
                  const isDeployed = deployedMaterialIds.has(mat.id);
                  const isHighlighted = activeHighlightedId === mat.id;
                  const isPreviewing = previewingVideoId === mat.id;

                  return (
                    <div
                      key={mat.id}
                      id={`store-mat-${mat.id}`}
                      className={`bg-white/80 backdrop-blur-xl rounded-2xl p-4 border transition flex flex-col justify-between space-y-3 ${
                        isHighlighted
                          ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/30 shadow-md'
                          : 'border-white/90 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Highlight Banner if matched by AI */}
                        {isHighlighted && (
                          <div className="flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                            <span>Найдено по вашему запросу через ИИ-чат</span>
                          </div>
                        )}

                        {/* Material Meta Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="p-1 rounded-md bg-slate-100 text-slate-700 text-xs">
                              {mat.type === 'video' && <Film className="w-3.5 h-3.5" />}
                              {mat.type === 'presentation' && <FileSpreadsheet className="w-3.5 h-3.5" />}
                              {mat.type === 'file' && <FileCode className="w-3.5 h-3.5" />}
                              {mat.type === 'text' && <FileText className="w-3.5 h-3.5" />}
                            </span>
                            <span className="text-[11px] font-medium text-slate-700">
                              {mat.type === 'video' ? 'Видео' : mat.type === 'presentation' ? 'Презентация' : mat.type === 'file' ? 'Файл / Код' : 'Текст'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500">{mat.author}</span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200">
                              {mat.level === 'beginner' ? 'Новичок' : mat.level === 'intermediate' ? 'Практик' : 'Мастер'}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-sm text-slate-900 leading-snug">
                          {mat.title}
                        </h4>

                        {/* Inline Video Player Preview */}
                        {isPreviewing && mat.contentUrl && (
                          <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video shadow-md">
                            <video
                              src={mat.contentUrl}
                              controls
                              autoPlay
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                        {/* AI Essence Box (Admin contextual note) */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center space-x-1.5 text-slate-700 text-[10px] font-semibold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 text-slate-500" />
                            <span>Суть для ИИ (когда и кому вставить):</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {mat.aiEssence}
                          </p>
                        </div>

                        {/* AI Practice Guidelines Box */}
                        {mat.aiPracticeGuidelines && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                              Инструкция по практике:
                            </span>
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {mat.aiPracticeGuidelines}
                            </p>
                          </div>
                        )}

                        {/* Compiled Practice Preview */}
                        {compiled && (
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-emerald-800 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Практика скомпилирована ИИ</span>
                              </span>
                              <span className="text-[11px] text-emerald-700 font-mono">
                                Тест: {compiled.quiz?.length || 1} впр • Проект: Готов
                              </span>
                            </div>

                            {compiled.projectTask && (
                              <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-md border border-emerald-200">
                                <span className="font-semibold text-slate-900 block truncate">
                                  {compiled.projectTask.title}
                                </span>
                                <span className="text-slate-500 line-clamp-2 text-[11px] mt-0.5">
                                  {compiled.projectTask.description}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400 font-medium">
                          {mat.domain}
                        </div>

                        <div className="flex items-center space-x-2">
                          {mat.type === 'video' && mat.contentUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewingVideoId(previewingVideoId === mat.id ? null : mat.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer flex items-center space-x-1"
                              title={previewingVideoId === mat.id ? 'Скрыть видео' : 'Смотреть видео'}
                            >
                              <Film className="w-3.5 h-3.5 text-slate-500" />
                              <span>{previewingVideoId === mat.id ? 'Скрыть' : 'Видео'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCompilePractice(mat)}
                            disabled={isCompiling}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer ${
                              compiled 
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200' 
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                            }`}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
                            <span>
                              {isCompiling 
                                ? 'ИИ компилирует...' 
                                : compiled 
                                ? 'Перекомпилировать' 
                                : 'Скомпилировать практику'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeployToCourse(mat)}
                            disabled={isDeployed}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer ${
                              isDeployed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isDeployed ? 'В курсе (DAG)' : 'Встроить в курс'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ADMIN ADD MATERIAL MODAL */}
      {isAddMaterialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-text">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-xl space-y-4 text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-slate-700" />
                  <h3 className="font-semibold text-base text-slate-900">
                    Добавить материал в магазин знаний
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Администратор обязательно описывает <strong className="text-slate-800 font-medium">суть материала</strong>, чтобы ИИ понимал когда и какому ученику его вставить, и мог составить точечную практику.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMaterialModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">
                  Название материала <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="Например: Внутреннее устройство B-Tree и дисковых страниц"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Тип материала</label>
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                  >
                    <option value="video">Видео (с сутью для ИИ)</option>
                    <option value="presentation">Презентация / Слайды</option>
                    <option value="file">Файл / Исходный код</option>
                    <option value="text">Текст / Конспект</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Автор / Эксперт</label>
                  <input
                    type="text"
                    value={matAuthor}
                    onChange={(e) => setMatAuthor(e.target.value)}
                    placeholder="@expert"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Направление</label>
                  <select
                    value={matDomain}
                    onChange={(e) => setMatDomain(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                  >
                    <option value="Универсальные навыки & Мастерство">Универсальные навыки & Мастерство</option>
                    <option value="Иностранные языки & Речь">Иностранные языки & Речь</option>
                    <option value="Ораторское мастерство & Переговоры">Ораторское мастерство & Переговоры</option>
                    <option value="Дизайн и UI/UX">Дизайн и UI/UX</option>
                    <option value="Бизнес, Финансы & Менеджмент">Бизнес, Финансы & Менеджмент</option>
                    <option value="Критическое мышление & Логика">Критическое мышление & Логика</option>
                    <option value="Музыка и Звук">Музыка и Звук</option>
                    <option value="Здоровье & Биомеханика">Здоровье & Биомеханика</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Целевой уровень</label>
                  <select
                    value={matLevel}
                    onChange={(e) => setMatLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                  >
                    <option value="beginner">Новичок (С нуля, без сленга)</option>
                    <option value="intermediate">Практик (Боевой продакшен)</option>
                    <option value="master">Мастер (Архитектор, высокие нагрузки)</option>
                  </select>
                </div>
              </div>

              {/* URL or Text */}
              {matType !== 'text' ? (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">
                    URL ресурса ({matType === 'video' ? 'видеопоток' : matType === 'presentation' ? 'ссылка на слайды' : 'ссылка на файл'})
                  </label>
                  <input
                    type="url"
                    value={matContentUrl}
                    onChange={(e) => setMatContentUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white font-mono text-[11px]"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Текст теории / Конспект</label>
                  <textarea
                    rows={4}
                    value={matTextContent}
                    onChange={(e) => setMatTextContent(e.target.value)}
                    placeholder="Теоретический материал в формате Markdown..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-xs font-mono"
                  />
                </div>
              )}

              {/* Mandatory AI Essence */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                    <span>Суть материала для ИИ (когда и кому вставить) *</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Обязательно</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Запишите суть материала, чтобы ИИ понимал: кому и в какой момент учебного графа его предложить, и на какие тезисы опираться при составлении практики.
                </p>
                <textarea
                  required
                  rows={4}
                  value={matAiEssence}
                  onChange={(e) => setMatAiEssence(e.target.value)}
                  placeholder="Пример: Разбор низкоуровневого хранения в PostgreSQL. 24-байтный заголовок, структура PageHeaderData, битовые маски pd_flags. ИИ должен предлагать этот материал студентам перед задачами на буферный пул и транзакции."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 text-xs"
                />
              </div>

              {/* AI Practice Instructions */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <Code2 className="w-3.5 h-3.5 text-slate-700" />
                  <span>Инструкции по практике для ИИ (тест и проект)</span>
                </label>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Какие практические задания и критерии оценки ИИ должен сгенерировать для этого материала.
                </p>
                <textarea
                  rows={3}
                  value={matAiPracticeGuidelines}
                  onChange={(e) => setMatAiPracticeGuidelines(e.target.value)}
                  placeholder="Пример: Составить тест на выявление фрагментации кортежей и проект на парсинг 24-байтного буфера без использования ORM."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  disabled={!matTitle.trim() || !matAiEssence.trim()}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-medium flex items-center space-x-2 transition cursor-pointer shadow-2xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Сохранить в магазин</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN VIDEO UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-text">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-xl space-y-4 text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-slate-700" />
                  <h3 className="font-semibold text-base text-slate-900">
                    Загрузка видео в базу знаний
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Админ перед загрузкой указывает подробно, о чем видео. ИИ-оркестратор считывает это описание и решает: подходит ли видео для студента и на каком этапе его встроить, либо синтезирует новый модуль.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUploadedVideo} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">
                  Название обучающего видео <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: B-Tree индексы, селективность и минимизация дискового I/O"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Автор / Эксперт</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="@db_ninja"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Длительность (мин)</label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={newDurationMin}
                    onChange={(e) => setNewDurationMin(Number(e.target.value) || 30)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Направление</label>
                  <select
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                  >
                    <option value="Универсальные навыки & Мастерство">Универсальные навыки & Мастерство</option>
                    <option value="Иностранные языки & Речь">Иностранные языки & Речь</option>
                    <option value="Ораторское мастерство & Переговоры">Ораторское мастерство & Переговоры</option>
                    <option value="Дизайн и UI/UX">Дизайн и UI/UX</option>
                    <option value="Бизнес, Финансы & Менеджмент">Бизнес, Финансы & Менеджмент</option>
                    <option value="Критическое мышление & Логика">Критическое мышление & Логика</option>
                    <option value="Музыка и Звук">Музыка и Звук</option>
                    <option value="Здоровье & Биомеханика">Здоровье & Биомеханика</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-slate-700">Целевой уровень</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                  >
                    <option value="beginner">Новичок (С нуля, без сленга)</option>
                    <option value="intermediate">Практик (Боевой продакшен)</option>
                    <option value="master">Мастер (Архитектор, высокие нагрузки)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">URL видеопотока</label>
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white font-mono text-[11px]"
                />
              </div>

              {/* Crucial Detailed Description Field */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    <span>Подробное описание видео (для ИИ-оркестратора) *</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Обязательно</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Опишите суть видео максимально подробно: какие концепции разбираются, какие термины вводятся, какие задачи решаются, для каких проблем студента это ключевое решение.
                </p>
                <textarea
                  required
                  rows={5}
                  value={newDetailedDescription}
                  onChange={(e) => setNewDetailedDescription(e.target.value)}
                  placeholder="Пример: В видео подробно разбирается организация 8KB дисковой страницы в PostgreSQL, формат Slotted Page, смещения tuple pointer и накладные расходы при фрагментации. Практическая часть показывает, как настроить fillfactor при частых UPDATE и предотвратить page split. Идеально для преодоления узких мест в базах данных."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 font-sans leading-relaxed text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  id="btn-confirm-admin-upload"
                  disabled={!newTitle.trim() || !newDetailedDescription.trim()}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-medium flex items-center space-x-2 shadow-2xs transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Одобрить и проиндексировать в базе</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* PDF & DOCUMENT DISTILLER MODAL (Universal Firebase Knowledge Cache) */}
      {isPdfDistillModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-text">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Дистиллятор PDF & Учебных материалов
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Универсальный кэш Firebase: извлекает чистую суть, инварианты и практику для всех ИИ-агентов
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPdfDistillModalOpen(false);
                  setDistilledPdfResult(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!distilledPdfResult ? (
              <div className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleDistillPdfFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-8 text-center transition flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">
                      Перетащите PDF, TXT или MD файл сюда
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Парсер извлечет текст, удалит воду и сохранит кристаллизованную суть в Firebase
                    </p>
                  </div>

                  <label className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm">
                    <span>Выбрать файл с устройства</span>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleDistillPdfFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>

                {isDistillingPdf && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2 animate-pulse">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-800">{pdfUploadStatus}</p>
                    <p className="text-[11px] text-slate-500">
                      Сверяем хэш документа с глобальной базой Firestore...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Distilled Result View */
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900 block text-xs">
                        {distilledPdfResult.title}
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        {distilledPdfResult.authorOrSource} • {distilledPdfResult.domain}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-mono font-bold">
                    ⚡ Кэшировано в Firestore
                  </span>
                </div>

                {/* Key Invariants */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Выделенные академические инварианты (Без воды):</span>
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-700 leading-relaxed">
                    {(distilledPdfResult.keyInvariants || []).map((inv: string, idx: number) => (
                      <li key={idx}>{inv}</li>
                    ))}
                  </ul>
                </div>

                {/* Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 text-xs">Концентрированная суть:</span>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {distilledPdfResult.summary}
                  </p>
                </div>

                {/* Structured Modules & Quiz */}
                {distilledPdfResult.structuredModules?.[0] && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 text-xs">Автоматически скомпилированная практика:</span>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        🎯 {distilledPdfResult.structuredModules[0].practicalExercise?.title}
                      </span>
                      <p className="text-[11px] text-slate-600">
                        {distilledPdfResult.structuredModules[0].practicalExercise?.instruction}
                      </p>
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDistilledPdfResult(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    ← Выбрать другой файл
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyDistilledPdf}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Добавить в магазин и включить в курс</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
