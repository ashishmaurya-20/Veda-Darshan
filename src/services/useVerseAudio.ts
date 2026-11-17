import { useState, useEffect, useRef, useCallback } from 'react';

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface UseVerseAudioReturn {
  audioState: AudioState;
  toggle: (text: string) => void;
  stop: () => void;
}

// Pick the best deep male Hindi/Indian voice from browser voices
function pickDeepMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const priority = [
    // Best: hi-IN male voices by known names
    (v: SpeechSynthesisVoice) => /hi[-_]IN/i.test(v.lang) && /karan|ravi|aditi|male|man/i.test(v.name),
    // hi-IN any
    (v: SpeechSynthesisVoice) => /hi[-_]IN/i.test(v.lang),
    // hi any
    (v: SpeechSynthesisVoice) => /\bhi\b/i.test(v.lang),
    // Indian English male as last resort
    (v: SpeechSynthesisVoice) => /en[-_]IN/i.test(v.lang),
    // Any voice at all
    (v: SpeechSynthesisVoice) => !!v,
  ];
  for (const test of priority) {
    const match = voices.find(test);
    if (match) return match;
  }
  return null;
}

export function useVerseAudio(): UseVerseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const utteranceRef   = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElRef     = useRef<HTMLAudioElement | null>(null);
  const currentTextRef = useRef<string>('');
  const modeRef        = useRef<'speech' | 'audio'>('speech');

  useEffect(() => {
    return () => {
      try { window.speechSynthesis?.cancel(); } catch (_) {}
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
    };
  }, []);

  const stopAll = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch (_) {}
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = '';
      audioElRef.current = null;
    }
    setAudioState('idle');
    currentTextRef.current = '';
  }, []);

  // Server-side espeak-ng: deep male Hindi voice
  const playWithServerTTS = useCallback((text: string) => {
    setAudioState('loading');
    modeRef.current = 'audio';
    const url = `/api/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio(url);
    audioElRef.current = audio;
    audio.oncanplaythrough = () => {
      setAudioState('playing');
      audio.play().catch(() => setAudioState('error'));
    };
    audio.onended  = () => { setAudioState('idle'); currentTextRef.current = ''; };
    audio.onerror  = () => setAudioState('error');
    audio.onpause  = () => { if (!audio.ended) setAudioState('paused'); };
    audio.onplay   = () => setAudioState('playing');
    audio.load();
  }, []);

  // Browser Web Speech API — deep male, slow, resonant
  const playWithSpeechAPI = useCallback((text: string) => {
    if (!window.speechSynthesis) return false;
    const voices   = window.speechSynthesis.getVoices();
    const voice    = pickDeepMaleVoice(voices);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang   = 'hi-IN';
    utterance.rate   = 0.72;   // very slow — meditative, clear pronunciation
    utterance.pitch  = 0.80;   // low pitch — deep, resonant male voice
    utterance.volume = 1.0;
    if (voice) utterance.voice = voice;

    utterance.onstart  = () => setAudioState('playing');
    utterance.onend    = () => { setAudioState('idle'); currentTextRef.current = ''; };
    utterance.onerror  = (e) => {
      console.warn('SpeechSynthesis error, falling back to server TTS:', e.error);
      playWithServerTTS(text);
    };
    utterance.onpause  = () => setAudioState('paused');
    utterance.onresume = () => setAudioState('playing');

    utteranceRef.current = utterance;
    modeRef.current = 'speech';
    setAudioState('loading');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  }, [playWithServerTTS]);

  const toggle = useCallback((text: string) => {
    // Same verse already playing → pause / resume
    if (currentTextRef.current === text && (audioState === 'playing' || audioState === 'paused')) {
      if (audioState === 'playing') {
        if (modeRef.current === 'speech') {
          window.speechSynthesis?.pause();
        } else {
          audioElRef.current?.pause();
        }
        setAudioState('paused');
      } else {
        if (modeRef.current === 'speech') {
          window.speechSynthesis?.resume();
        } else {
          audioElRef.current?.play();
        }
        setAudioState('playing');
      }
      return;
    }

    // New verse — stop current and start fresh
    stopAll();
    currentTextRef.current = text;

    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        playWithSpeechAPI(text);
      } else {
        setAudioState('loading');
        let settled = false;
        const onVoices = () => {
          if (settled) return;
          settled = true;
          window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
          playWithSpeechAPI(text);
        };
        window.speechSynthesis.addEventListener('voiceschanged', onVoices);
        // Hard fallback to server after 2.5 s
        setTimeout(() => {
          if (!settled) {
            settled = true;
            window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
            playWithServerTTS(text);
          }
        }, 2500);
      }
    } else {
      playWithServerTTS(text);
    }
  }, [audioState, stopAll, playWithSpeechAPI, playWithServerTTS]);

  return { audioState, toggle, stop: stopAll };
}
