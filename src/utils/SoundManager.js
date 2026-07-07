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

  // Smooth "Pop / Cubit" sound for sending message
  playSend() {
    this.init();
    const isSoundEnabled = localStorage.getItem('anora_sound_enabled') !== 'false';
    if (!isSoundEnabled || !this.audioCtx) return;
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    // Frequency sweep down to simulate a cute "bloop" or pop
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.1);
    
    // Quick fade out
    gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
    
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  // Smooth "Bubble Drop" sound for receiving channel messages
  playReceiveChannel() {
    this.init();
    const isSoundEnabled = localStorage.getItem('anora_sound_enabled') !== 'false';
    if (!isSoundEnabled || !this.audioCtx) return;
    
    // Bubble 1
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.frequency.setValueAtTime(500, this.audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.1);
    gain1.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
    osc1.type = 'sine';
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start();
    osc1.stop(this.audioCtx.currentTime + 0.1);

    // Bubble 2 (slightly higher and later)
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.frequency.setValueAtTime(700, this.audioCtx.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1000, this.audioCtx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.2, this.audioCtx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
    osc2.type = 'sine';
    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);
    osc2.start(this.audioCtx.currentTime + 0.1);
    osc2.stop(this.audioCtx.currentTime + 0.2);
  }

  // Crystal "Ting" sound for Private Messages or Mentions
  playReceivePM() {
    this.init();
    const isSoundEnabled = localStorage.getItem('anora_sound_enabled') !== 'false';
    if (!isSoundEnabled || !this.audioCtx) return;
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    // High pitch crystal sound
    osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
    // Add a tiny bit of frequency slide for smoothness
    osc.frequency.exponentialRampToValueAtTime(1100, this.audioCtx.currentTime + 0.3);
    
    // Soft attack, long decay like a bell
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
    
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.4);
  }

  playAnora() {
    this.init();
    const isSoundEnabled = localStorage.getItem('anora_sound_enabled') !== 'false';
    if (!isSoundEnabled || !this.audioCtx) return;
    
    // Sparkle effect for Anora messages
    [0, 0.1, 0.2].forEach((offset, index) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.frequency.setValueAtTime(1000 + (index * 300), this.audioCtx.currentTime + offset);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + offset + 0.2);
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime + offset);
      osc.stop(this.audioCtx.currentTime + offset + 0.2);
    });
  }
}

export const soundManager = new SoundManager();
