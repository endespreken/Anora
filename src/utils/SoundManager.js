class SoundManager {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(frequency, type, duration, vol, startTimeOffset = 0) {
    if (!this.audioCtx) return;
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime + startTimeOffset);
    
    gainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime + startTimeOffset);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + startTimeOffset + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    oscillator.start(this.audioCtx.currentTime + startTimeOffset);
    oscillator.stop(this.audioCtx.currentTime + startTimeOffset + duration);
  }

  playSend() {
    this.init();
    this.playTone(440, 'sine', 0.1, 0.1);
    this.playTone(880, 'sine', 0.15, 0.1, 0.05);
  }

  playReceiveChannel() {
    this.init();
    this.playTone(600, 'sine', 0.1, 0.1);
    this.playTone(800, 'sine', 0.15, 0.1, 0.1);
  }

  playReceivePM() {
    this.init();
    this.playTone(800, 'triangle', 0.1, 0.15);
    this.playTone(1200, 'triangle', 0.2, 0.15, 0.1);
    this.playTone(1600, 'triangle', 0.3, 0.15, 0.2);
  }

  playAnora() {
    this.init();
    this.playTone(300, 'square', 0.1, 0.05);
    this.playTone(450, 'square', 0.15, 0.05, 0.1);
    this.playTone(600, 'square', 0.2, 0.05, 0.2);
  }

  playRingtone() {
    this.init();
    // A standard UK-like ring pattern (brrr-brrr)
    this.playTone(400, 'sine', 0.4, 0.2);
    this.playTone(450, 'sine', 0.4, 0.2);
    this.playTone(400, 'sine', 0.4, 0.2, 0.6);
    this.playTone(450, 'sine', 0.4, 0.2, 0.6);
  }

  playDialTone() {
    this.init();
    // A standard dial tone (continuous sound, we simulate a burst)
    this.playTone(425, 'sine', 1.0, 0.1);
  }
}

export const soundManager = new SoundManager();
