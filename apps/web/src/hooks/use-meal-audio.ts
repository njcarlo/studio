/**
 * use-meal-audio.ts
 *
 * Synthesised audio feedback for the Meal Stub Assigner.
 * Uses the Web Audio API exclusively — no audio files needed.
 *
 * Sound profiles
 * ─────────────────────────────────────────────────────────
 *  Full-Time   → warm C-major arpeggio (rich, authoritative)
 *  On-Call     → crisp single bell ping (bright, snappy)
 *  Volunteer   → soft two-note chime (gentle, friendly)
 *  Double (×2) → rising double-chime (Sunday celebration)
 *  Error       → low descending buzz (blocked / limit)
 *  Zero        → quiet neutral blip (0 stubs on Sunday)
 * ─────────────────────────────────────────────────────────
 */

import { useCallback, useRef } from 'react';

type EmploymentType = 'Full-Time' | 'On-Call' | 'Volunteer' | undefined;

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/** Returns a shared AudioContext, lazily created and resumed on first use. */
function getAudioCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!ref.current) {
        try {
            ref.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch {
            return null;
        }
    }
    if (ref.current.state === 'suspended') {
        ref.current.resume().catch(() => { });
    }
    return ref.current;
}

/** Plays a single synthesised note. */
function playNote(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainPeak: number = 0.35,
    attackTime: number = 0.01,
    releaseTime: number = 0.12,
) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - releaseTime);

    osc.start(startTime);
    osc.stop(startTime + duration);
}

/** Plays a "bell" tone by summing two oscillators (sine + triangle). */
function playBell(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    decayMs: number = 600,
    gain: number = 0.28,
) {
    playNote(ctx, freq, startTime, decayMs / 1000, 'sine', gain, 0.005, 0.05);
    playNote(ctx, freq * 2.76, startTime, (decayMs * 0.6) / 1000, 'triangle', gain * 0.18, 0.005, 0.04);
}

// ---------------------------------------------------------------------------
// Exported hook
// ---------------------------------------------------------------------------

export function useMealAudio() {
    const ctxRef = useRef<AudioContext | null>(null);

    /**
     * playSuccess – plays a success sound based on employment type and count.
     * @param type  Employment type of the worker
     * @param count Number of stubs issued (0, 1, or 2)
     */
    const playSuccess = useCallback((type: EmploymentType, count: number = 1) => {
        const ctx = getAudioCtx(ctxRef);
        if (!ctx) return;
        const now = ctx.currentTime;

        if (count === 0) {
            // Zero — quiet neutral blip
            playNote(ctx, 440, now, 0.08, 'sine', 0.12, 0.005, 0.07);
            return;
        }

        if (type === 'Full-Time') {
            // Warm C-major arpeggio: C4 → E4 → G4 → C5
            const notes = [261.63, 329.63, 392.0, 523.25];
            notes.forEach((freq, i) => {
                playNote(ctx, freq, now + i * 0.07, 0.28, 'triangle', 0.28, 0.01, 0.10);
            });
            if (count === 2) {
                // Repeat arpeggio slightly higher for the second stub
                notes.forEach((freq, i) => {
                    playNote(ctx, freq * 1.5, now + 0.35 + i * 0.07, 0.22, 'sine', 0.20, 0.01, 0.10);
                });
            }
        } else if (type === 'On-Call') {
            // Crisp bell ping — A5 with subtle harmonic
            playBell(ctx, 880, now, 650, 0.32);
            if (count === 2) {
                playBell(ctx, 1046.5, now + 0.28, 500, 0.26); // C6 follow-up
            }
        } else {
            // Volunteer — soft two-note chime: G5 → D5
            playBell(ctx, 783.99, now, 450, 0.22);        // G5
            playBell(ctx, 587.33, now + 0.18, 550, 0.20); // D5
            if (count === 2) {
                playBell(ctx, 880, now + 0.38, 450, 0.18);  // A5 extra for 2 stubs
            }
        }
    }, []);

    /** playError – a low descending buzz for rejected/blocked actions. */
    const playError = useCallback(() => {
        const ctx = getAudioCtx(ctxRef);
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.4);
    }, []);

    return { playSuccess, playError };
}
