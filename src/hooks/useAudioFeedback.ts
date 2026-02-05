/**
 * Plays camera shutter sound when screenshot is captured
 * Uses Web Audio API for minimal, non-intrusive feedback
 */
export function playScreenshotSound() {
	// Check if sound is enabled (default: true)
	const soundEnabled = localStorage.getItem('qabooster-sound') !== 'false';
	if (!soundEnabled) return;

	// Create minimalist camera sound using Web Audio API
	const audioContext = new AudioContext();
	const oscillator = audioContext.createOscillator();
	const gainNode = audioContext.createGain();

	oscillator.connect(gainNode);
	gainNode.connect(audioContext.destination);

	oscillator.frequency.value = 800;
	oscillator.type = 'sine';

	gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
	gainNode.gain.exponentialRampToValueAtTime(
		0.01,
		audioContext.currentTime + 0.1,
	);

	oscillator.start(audioContext.currentTime);
	oscillator.stop(audioContext.currentTime + 0.1);
}
