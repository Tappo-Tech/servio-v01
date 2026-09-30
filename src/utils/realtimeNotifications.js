export function playRealtimeNotification(kind = "order") {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const isWaiter = kind === "waiter";
    const notes = isWaiter ? [660, 880, 660] : [880, 1046.5, 1318.5];
    const gain = context.createGain();
    const oscillator = context.createOscillator();

    oscillator.type = isWaiter ? "triangle" : "sine";
    oscillator.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);

    notes.forEach((frequency, index) => {
      const start = now + index * 0.14;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.exponentialRampToValueAtTime(0.34, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    });

    oscillator.start(now);
    oscillator.stop(now + 0.52);
    oscillator.addEventListener("ended", () => context.close());
  } catch (error) {
    console.debug("تعذر تشغيل صوت الإشعار:", error);
  }
}
