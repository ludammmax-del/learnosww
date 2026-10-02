/**
 * Real In-Browser Code & Logic Execution Engine
 * Provides safe, isolated execution of JavaScript, TypeScript, Python-like logic,
 * and deterministic unit test assertions with real stdout, stderr, execution time, and error traces.
 */

export interface TestResult {
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  error?: string;
  durationMs?: number;
}

export interface ExecutionOutput {
  success: boolean;
  logs: Array<{ type: 'log' | 'info' | 'warn' | 'error'; text: string; time: number }>;
  returnValue?: any;
  testResults: TestResult[];
  testsPassed: number;
  totalTests: number;
  durationMs: number;
  runtimeError?: string;
}

export class ExecutionSandboxService {
  /**
   * Run user code with optional automated test assertions in a sandboxed Web Worker / Function scope
   */
  public async executeCode(
    code: string,
    tests: Array<{ name: string; testFnBody: string }> = [],
    language: 'javascript' | 'typescript' | 'python' | 'text' = 'typescript'
  ): Promise<ExecutionOutput> {
    const startTime = performance.now();
    const logs: Array<{ type: 'log' | 'info' | 'warn' | 'error'; text: string; time: number }> = [];

    // Custom console logger
    const customConsole = {
      log: (...args: any[]) => {
        logs.push({
          type: 'log',
          text: args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '),
          time: Date.now(),
        });
      },
      info: (...args: any[]) => {
        logs.push({
          type: 'info',
          text: args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '),
          time: Date.now(),
        });
      },
      warn: (...args: any[]) => {
        logs.push({
          type: 'warn',
          text: args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '),
          time: Date.now(),
        });
      },
      error: (...args: any[]) => {
        logs.push({
          type: 'error',
          text: args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '),
          time: Date.now(),
        });
      },
    };

    // If text or non-executable format, validate structure
    if (language === 'text' || (!code.trim().includes('function') && !code.trim().includes('def ') && !code.trim().includes('class ') && !code.trim().includes('const ') && !code.trim().includes('let ') && !code.trim().includes('var ') && !code.trim().includes('import '))) {
      const wordsCount = code.trim().split(/\s+/).filter(Boolean).length;
      const hasStructure = code.includes('#') || code.includes('- ') || code.includes('1.') || code.includes(':');
      
      logs.push({
        type: 'info',
        text: `Текстовый артефакт проверен: ${wordsCount} слов. Структурированность: ${hasStructure ? 'Высокая' : 'Базовая'}.`,
        time: Date.now(),
      });

      return {
        success: wordsCount > 10,
        logs,
        returnValue: `Слов: ${wordsCount}`,
        testResults: [
          { name: 'Полнота раскрытия задачи (объем)', passed: wordsCount >= 15 },
          { name: 'Логическая структура (тезисы/пункты)', passed: hasStructure },
        ],
        testsPassed: (wordsCount >= 15 ? 1 : 0) + (hasStructure ? 1 : 0),
        totalTests: 2,
        durationMs: Math.round(performance.now() - startTime),
      };
    }

    if (language === 'python') {
      try {
        const response = await fetch('/api/code/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            language: 'python',
            tests,
            timeoutMs: 8000,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return {
          success: Boolean(data.success),
          logs: Array.isArray(data.logs) ? data.logs : [],
          returnValue: data.stdout || undefined,
          testResults: Array.isArray(data.testResults) ? data.testResults : [],
          testsPassed: data.testsPassed ?? 0,
          totalTests: data.totalTests ?? tests.length,
          durationMs: data.durationMs || Math.round(performance.now() - startTime),
          runtimeError: data.stderr || data.runtimeError || undefined,
        };
      } catch (err: any) {
        return {
          success: false,
          logs: [{ type: 'error', text: `Ошибка выполнения Python: ${err.message}`, time: Date.now() }],
          testResults: [],
          testsPassed: 0,
          totalTests: tests.length,
          durationMs: Math.round(performance.now() - startTime),
          runtimeError: err.message,
        };
      }
    }

    if (typeof document === 'undefined') {
      return {
        success: false,
        logs: [{ type: 'error', text: 'Изолированная среда недоступна.', time: Date.now() }],
        testResults: [],
        testsPassed: 0,
        totalTests: tests.length,
        durationMs: Math.round(performance.now() - startTime),
        runtimeError: 'Sandbox iframe unavailable',
      };
    }

    const executableCode = code
      .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
      .replace(/type\s+\w+\s*=[\s\S]*?;/g, '')
      .replace(/:\s*(string|number|boolean|any|void|object|unknown|never|Record<[\w,\s]+>|\w+\[\]|\w+)\b/g, '')
      .replace(/as\s+\w+/g, '');

    const sandboxDocument = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; img-src 'none'; media-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'"><script>
      window.addEventListener('message', function(event) {
        if (event.source !== parent || event.data?.type !== 'run') return;
        const request = event.data;
        const logs = [];
        const writeLog = (type, args) => {
          let text;
          try { text = args.map(value => typeof value === 'object' ? JSON.stringify(value) : String(value)).join(' '); }
          catch { text = '[unserializable output]'; }
          logs.push({ type, text, time: Date.now() });
        };
        const isolatedConsole = {
          log: (...args) => writeLog('log', args),
          info: (...args) => writeLog('info', args),
          warn: (...args) => writeLog('warn', args),
          error: (...args) => writeLog('error', args),
        };
        const assert = {
          strictEqual: (actual, expected, message) => {
            if (actual !== expected) throw new Error(message || 'Ожидалось: ' + JSON.stringify(expected) + ', получено: ' + JSON.stringify(actual));
          },
          deepStrictEqual: (actual, expected, message) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message || 'Ожидалось: ' + JSON.stringify(expected) + ', получено: ' + JSON.stringify(actual));
          },
          ok: (value, message) => { if (!value) throw new Error(message || 'Условие не выполнено'); },
        };
        const cases = request.tests.length ? request.tests : [{ name: 'Запуск кода', testFnBody: '' }];
        const testResults = [];
        for (const test of cases) {
          const startedAt = performance.now();
          try {
            const module = { exports: {} };
            const runner = new Function('console', 'codeScope', 'module', 'exports', 'assert',
              '"use strict";\\n' + request.code + '\\n' + test.testFnBody);
            runner(isolatedConsole, module.exports, module, module.exports, assert);
            testResults.push({ name: test.name, passed: true, durationMs: Math.round(performance.now() - startedAt) });
          } catch (error) {
            testResults.push({ name: test.name, passed: false, error: error?.message || String(error), durationMs: Math.round(performance.now() - startedAt) });
          }
        }
        const passed = testResults.filter(test => test.passed).length;
        parent.postMessage({
          type: 'complete',
          requestId: request.requestId,
          output: {
            success: testResults.every(test => test.passed),
            logs,
            testResults,
            testsPassed: request.tests.length ? passed : 0,
            totalTests: request.tests.length,
            durationMs: testResults.reduce((sum, test) => sum + test.durationMs, 0),
          },
        }, '*');
      }, { once: true });
    <\\/script>`;

    return new Promise<ExecutionOutput>((resolve) => {
      const frame = document.createElement('iframe');
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timeoutMs = 3000;
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.style.display = 'none';
      frame.srcdoc = sandboxDocument;

      const finish = (output: ExecutionOutput) => {
        window.removeEventListener('message', onMessage);
        clearTimeout(timeout);
        frame.remove();
        resolve({ ...output, durationMs: Math.round(performance.now() - startTime) });
      };

      const onMessage = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow || event.data?.type !== 'complete' || event.data?.requestId !== requestId) return;
        finish(event.data.output as ExecutionOutput);
      };

      const timeout = setTimeout(() => {
        finish({
          success: false,
          logs: [{ type: 'error', text: `Превышено время выполнения (${timeoutMs} мс).`, time: Date.now() }],
          testResults: [],
          testsPassed: 0,
          totalTests: tests.length,
          durationMs: timeoutMs,
          runtimeError: 'Execution timed out',
        });
      }, timeoutMs);

      window.addEventListener('message', onMessage);
      frame.addEventListener('load', () => {
        frame.contentWindow?.postMessage({ type: 'run', requestId, code: executableCode, tests }, '*');
      }, { once: true });
      document.body.appendChild(frame);
    });
  }
}

export const executionSandbox = new ExecutionSandboxService();
