import React, { useState } from 'react';
import { X, Sparkles, Plus, Clock, Award, BookOpen, Network } from 'lucide-react';
import { DAGNode } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

interface LearningCreateNodeModalProps {
  onClose: () => void;
  onCreate: (node: DAGNode) => void;
  existingNodesCount: number;
}

export const LearningCreateNodeModal: React.FC<LearningCreateNodeModalProps> = ({
  onClose,
  onCreate,
  existingNodesCount,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [sprint, setSprint] = useState('Sprint 3');
  const [estimatedTimeMin, setEstimatedTimeMin] = useState(30);
  const [artifactRequirement, setArtifactRequirement] = useState('Модуль с тестами граничных условий');
  const [authorName, setAuthorName] = useState('@lead_architect');
  const [type, setType] = useState<'theory' | 'practice' | 'project' | 'injection' | 'exam'>('practice');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const phaseTitle = 
      phase === 1 ? 'Месяц 1: Фундамент архитектуры' :
      phase === 2 ? 'Месяц 2: Связки и Системы' : 
      'Месяц 3: Hard-Проекты';

    const newNode: DAGNode = {
      id: `node-${Date.now()}`,
      unitId: `unit-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Инженерное изучение структуры и практическая реализация артефакта',
      phase,
      phaseTitle,
      sprint,
      type,
      status: 'active',
      x: 80 + (existingNodesCount % 5) * 400,
      y: 180 + Math.floor(existingNodesCount / 5) * 260,
      dependencies: [],
      estimatedTimeMin: Number(estimatedTimeMin) || 30,
      authorName,
      artifactRequirement: artifactRequirement.trim() || 'Проверочный код решения в портфолио',
    };

    onCreate(newNode);
    playChime('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl text-slate-800 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Добавить тему в DAG-Граф</h3>
              <p className="text-[11px] text-slate-500">Встроить новый квант знаний в образовательную траекторию</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1.5">
              Название темы / модуля <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: WAL и отказоустойчивость в PostgreSQL"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Краткое описание (Инженерная цель)</label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Что конкретно будет изучено на практике и почему это критично для продакшена"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1.5">Фаза обучения</label>
              <select
                value={phase}
                onChange={(e) => setPhase(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
              >
                <option value={1}>Месяц 1: Фундамент архитектуры</option>
                <option value={2}>Месяц 2: Связки и Системы</option>
                <option value={3}>Месяц 3: Hard-Проекты</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1.5">Спринт</label>
              <input
                type="text"
                value={sprint}
                onChange={(e) => setSprint(e.target.value)}
                placeholder="Sprint 1..6"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1.5">Время на изучение (мин)</label>
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={estimatedTimeMin}
                  onChange={(e) => setEstimatedTimeMin(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1.5">Тип модуля</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
              >
                <option value="practice">Практика (Действие 70%)</option>
                <option value="theory">Теория & Концепты</option>
                <option value="project">Ролевой проект</option>
                <option value="injection">ИИ-Инъекция (устранение затыка)</option>
                <option value="exam">Финальный экзамен</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1.5">
              Обязательный артефакт в портфолио (70% сдачи)
            </label>
            <input
              type="text"
              value={artifactRequirement}
              onChange={(e) => setArtifactRequirement(e.target.value)}
              placeholder="Например: Аудиозапись диалога / Figma прототип / План переговоров / Разбор кейса"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Куратор / Автор модуля</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="@lead_mentor"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center space-x-2 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить в DAG-Граф</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
