import confetti from 'canvas-confetti'

const PALETTE = ['#d6dde3', '#7fa6c6', '#aeb8c1', '#e9edf0', '#e07a7a']

/** Bursts confetti from the centre of `origin`. Skipped automatically under reduced motion. */
export function celebrate(origin: HTMLElement | null): void {
  const rect = origin?.getBoundingClientRect()
  const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5
  const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.6
  void confetti({
    particleCount: 110,
    spread: 75,
    startVelocity: 42,
    scalar: 0.9,
    origin: { x, y },
    colors: PALETTE,
    disableForReducedMotion: true,
  })
}
