/**
 * Microphone recording (MediaRecorder) and optional live transcript (Web Speech API).
 * Audio never leaves the device: we keep the Blob in memory and hand out an object URL.
 * The microphone is requested only when start() is called from a click.
 */

export function canRecord() {
  return !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

function pickMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const t of types) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch (_) {
      /* ignore */
    }
  }
  return '';
}

/**
 * @param {{ maxSeconds?: number, onTick?(s:number):void, onStop?(r:{blob,url,seconds,ext}):void, onError?(code:string):void }} o
 */
export function createRecorder({ maxSeconds = 60, onTick, onStop, onError } = {}) {
  let stream = null;
  let rec = null;
  let chunks = [];
  let t0 = 0;
  let timer = 0;
  let url = null;

  function cleanup() {
    clearInterval(timer);
    if (stream) stream.getTracks().forEach((tr) => tr.stop());
    stream = null;
  }

  return {
    get recording() {
      return !!rec && rec.state === 'recording';
    },
    async start() {
      if (!canRecord()) {
        onError && onError('unsupported');
        return false;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch (e) {
        const code = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'denied' : e && e.name === 'NotFoundError' ? 'nomic' : 'failed';
        onError && onError(code);
        return false;
      }
      const mimeType = pickMime();
      try {
        rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      } catch (_) {
        cleanup();
        onError && onError('failed');
        return false;
      }
      chunks = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      rec.onerror = () => {
        clearInterval(timer);
        cleanup();
        rec = null;
        onError && onError('failed');
      };
      rec.onstop = () => {
        const seconds = Math.min(maxSeconds, (performance.now() - t0) / 1000);
        cleanup();
        const type = rec.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type });
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(blob);
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        rec = null;
        onStop && onStop({ blob, url, seconds, ext });
      };
      try {
        rec.start(250);
      } catch (_) {
        rec = null;
        cleanup();
        onError && onError('failed');
        return false;
      }
      t0 = performance.now();
      onTick && onTick(0);
      timer = setInterval(() => {
        const s = (performance.now() - t0) / 1000;
        onTick && onTick(Math.min(s, maxSeconds));
        if (s >= maxSeconds) this.stop();
      }, 200);
      return true;
    },
    stop() {
      if (rec && rec.state !== 'inactive') rec.stop();
      clearInterval(timer);
    },
    discard() {
      if (url) URL.revokeObjectURL(url);
      url = null;
    },
  };
}

export function canTranscribe() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Live transcript in en-US. Restarts itself when the browser ends a session early (Chrome
 * stops after silences) until stop() is called.
 * @param {{ onText(finalText:string, interim:string):void, onError(code:string):void }} o
 */
export function createTranscriber({ onText, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  let rec = null;
  let active = false;
  let finalText = '';

  function begin() {
    rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += (finalText && !finalText.endsWith(' ') ? ' ' : '') + r[0].transcript.trim();
        else interim += r[0].transcript;
      }
      onText(finalText, interim.trim());
    };
    rec.onerror = (e) => {
      // 'no-speech' and 'aborted' are routine; the rest end the transcript for this take
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      active = false;
      onError(e.error || 'failed');
    };
    rec.onend = () => {
      if (active) {
        try {
          begin();
        } catch (_) {
          active = false;
        }
      }
    };
    rec.start();
  }

  return {
    start(initial = '') {
      finalText = initial;
      active = true;
      try {
        begin();
        return true;
      } catch (_) {
        active = false;
        onError('failed');
        return false;
      }
    },
    stop() {
      active = false;
      try {
        rec && rec.stop();
      } catch (_) {
        /* ignore */
      }
    },
  };
}
