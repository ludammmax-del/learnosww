import { callGeminiSafeJson } from './geminiApi.ts';
import { analyzeDiagnosticBlank } from './geminiApi.ts';

export interface CurriculumSprint {
  t: string;
  a: string;
  isRemedial?: boolean;
  remedialTopic?: string;
  isAdvanced?: boolean;
  masteredTopic?: string;
  aiCommentary?: string;
  isPairWork?: boolean;
}

export interface CurriculumModule {
  phase: number;
  title: string;
  author: string;
  sprints: CurriculumSprint[];
}

export function detectDomainCategory(rawDomain: string = '', rawGoal: string = '', rawRole: string = ''): string {
  const text = `${rawDomain} ${rawGoal} ${rawRole}`.toLowerCase();
  if (text.includes('язык') || text.includes('иностран') || text.includes('английск') || text.includes('english') || text.includes('german') || text.includes('french') || text.includes('spanish') || text.includes('словарь') || text.includes('грамматик') || text.includes('перевод') || text.includes('произношен') || text.includes('chunks')) {
    return 'languages';
  }
  if (text.includes('оратор') || text.includes('спикер') || text.includes('голос') || text.includes('выступлен') || text.includes('речь') || text.includes('презентац') || text.includes('харизм') || text.includes('переговор') || text.includes('дебат') || text.includes('питч') || text.includes('дикци')) {
    return 'speaking';
  }
  if (text.includes('бухгалтер') || text.includes('учет') || text.includes('дебет') || text.includes('кредит') || text.includes('финанс') || text.includes('баланс') || text.includes('account') || text.includes('налог') || text.includes('проводк') || text.includes('аудит')) {
    return 'accounting';
  }
  if (text.includes('дизайн') || text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('figma') || text.includes('интерфейс') || text.includes('график') || text.includes('композици') || text.includes('типографик') || text.includes('макет') || text.includes('сетк')) {
    return 'design';
  }
  if (text.includes('бизнес') || text.includes('продаж') || text.includes('стартап') || text.includes('маркет') || text.includes('предприним') || text.includes('управлен') || text.includes('менедж') || text.includes('product') || text.includes('юнит-эконом') || text.includes('воронк') || text.includes('клиент')) {
    return 'business';
  }
  if (text.includes('музык') || text.includes('звук') || text.includes('гитар') || text.includes('вокал') || text.includes('петь') || text.includes('фортепиан') || text.includes('гармон') || text.includes('ритм') || text.includes('слух') || text.includes('аккорд') || text.includes('сольфеджио') || text.includes('лад')) {
    return 'music';
  }
  if (text.includes('психолог') || text.includes('эмоци') || text.includes('отношен') || text.includes('поведен') || text.includes('терапи') || text.includes('стресс') || text.includes('привычк') || text.includes('кпт')) {
    return 'psychology';
  }
  if (text.includes('мышлени') || text.includes('логик') || text.includes('когнитив') || text.includes('решени') || text.includes('стратег') || text.includes('философ') || text.includes('ментальн')) {
    return 'thinking';
  }
  if (text.includes('здоров') || text.includes('тело') || text.includes('осанк') || text.includes('движен') || text.includes('фитнес') || text.includes('биомеханик') || text.includes('спорт') || text.includes('питан') || text.includes('сон')) {
    return 'health';
  }
  if (text.includes('программ') || text.includes('код') || text.includes('разработ') || text.includes('backend') || text.includes('frontend') || text.includes('devops') || text.includes('python') || text.includes('javascript') || text.includes('typescript') || text.includes('go') || text.includes('rust') || text.includes('sql') || text.includes('бд') || text.includes('субд') || text.includes('highload') || text.includes('архитектур')) {
    return 'tech';
  }
  return 'custom';
}
