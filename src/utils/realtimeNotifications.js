export function playRealtimeNotification(kind = "order") {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const isWaiter = kind === "waiter";
    // نستخدم نغمة واضحة ومتدرجة حتى يسمعها فريق التشغيل وسط ضوضاء المكان.
    const notes = isWaiter ? [660, 880, 660, 988] : [880, 1046.5, 1318.5, 1568];
    const gain = context.createGain();
    const oscillator = context.createOscillator();

    oscillator.type = isWaiter ? "triangle" : "sine";
    oscillator.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);

    notes.forEach((frequency, index) => {
      const start = now + index * 0.13;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.exponentialRampToValueAtTime(0.72, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
    });

    oscillator.start(now);
    oscillator.stop(now + 0.64);
    oscillator.addEventListener("ended", () => context.close());
  } catch (error) {
    console.debug("تعذر تشغيل صوت الإشعار:", error);
  }
}
