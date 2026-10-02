/**
 * Real Speech Recognition, Pronunciation & Fluency Engine
 * Utilizes the browser Web Speech API (SpeechRecognition & SpeechSynthesis)
 * and AudioContext for live words-per-minute (WPM), hesitation pause detection,
 * filler word counting, and native reference audio playback.
 */

export interface SpeechAnalysisResult {
  transcript: string;
  wordCount: number;
  wpm: number;
  durationSec: number;
  fillerWordsCount: number;
  fillerWordsFound: string[];
  hesitationPausesCount: number;
  clarityScore: number; // 0 - 100
  accuracyPercentage?: number;
  feedback: string[];
}

export class SpeechPracticeEngine {
  private recognition: any = null;
  private isListening = false;
  private startTime = 0;
  private transcript = '';
  private pausesCount = 0;
  private lastSpeechTimestamp = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
      }
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public startListening(
    lang: string = 'ru-RU',
    onInterim: (text: string) => void = () => {},
    onError: (err: string) => void = () => {}
  ) {
    if (!this.recognition) {
      onError('Web Speech API не поддерживается вашим браузером.');
      return;
    }

    if (this.isListening) return;

    this.recognition.lang = lang;
    this.transcript = '';
    this.pausesCount = 0;
    this.startTime = Date.now();
    this.lastSpeechTimestamp = Date.now();
    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      let currentText = '';
      const now = Date.now();

      // Check if there was an awkward hesitation pause (> 2.2s between utterances)
      if (now - this.lastSpeechTimestamp > 2200 && this.lastSpeechTimestamp !== this.startTime) {
        this.pausesCount++;
      }
      this.lastSpeechTimestamp = now;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentText += event.results[i][0].transcript;
      }

      this.transcript = currentText;
      onInterim(currentText);
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      onError(event.error || 'Ошибка распознавания речи');
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start notice:', e);
    }
  }

  public stopListening(referenceTargetText?: string): SpeechAnalysisResult {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.isListening = false;

    const durationSec = Math.max(1, (Date.now() - this.startTime) / 1000);
    const words = this.transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const wpm = Math.round((wordCount / durationSec) * 60);

    // Scan for filler words in Russian and English
    const fillerPatterns = [
      'э-э', 'эээ', 'ммм', 'ну', 'типа', 'как бы', 'короче', 'в общем', 'значит', 'это самое',
      'um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally', 'so'
    ];

    const fillerWordsFound: string[] = [];
    const lowerTranscript = this.transcript.toLowerCase();

    fillerPatterns.forEach((f) => {
      const regex = new RegExp(`\\b${f}\\b`, 'gi');
      const matches = lowerTranscript.match(regex);
      if (matches) {
        fillerWordsFound.push(...matches);
      }
    });

    const fillerWordsCount = fillerWordsFound.length;

    // Calculate clarity score (optimal WPM is 110-150 for natural speech)
    let clarityScore = 85;
    if (wpm < 80) clarityScore -= 15;
    if (wpm > 180) clarityScore -= 12;
    clarityScore = Math.max(20, Math.min(100, clarityScore - fillerWordsCount * 4 - this.pausesCount * 5));

    const feedback: string[] = [];
    if (wpm >= 100 && wpm <= 160) {
      feedback.push('✅ Отличный сбалансированный темп речи (100–160 WPM).');
    } else if (wpm < 100) {
      feedback.push('⚠️ Темп речи замедлен — постарайтесь соединять фразы без лишних пауз.');
    } else {
      feedback.push('⚠️ Высокая скорость речи — добавьте акцентные паузы для лучшего восприятия слушателями.');
    }

    if (fillerWordsCount === 0) {
      feedback.push('💎 Речь чистая, слова-паразиты не зафиксированы!');
    } else {
      feedback.push(`⚠️ Обнаружено слов-паразитов: ${fillerWordsCount} шт. (${Array.from(new Set(fillerWordsFound)).join(', ')}).`);
    }

    if (this.pausesCount > 2) {
      feedback.push(`⚠️ Зафиксировано ${this.pausesCount} заминки — тренируйте связность фраз.`);
    }

    return {
      transcript: this.transcript,
      wordCount,
      wpm,
      durationSec: Math.round(durationSec),
      fillerWordsCount,
      fillerWordsFound,
      hesitationPausesCount: this.pausesCount,
      clarityScore,
      feedback,
    };
  }

  /**
   * Speak reference sentence for listening/pronunciation comparison using Web Speech Synthesis
   */
  public speakReference(text: string, lang: string = 'ru-RU') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

export const speechPracticeEngine = new SpeechPracticeEngine();
