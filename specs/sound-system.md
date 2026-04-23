# Sound System - Perimeter Explorer

## Music
Normal levels use an upbeat arcade loop with light percussion and bright melody. Level 3 uses the same tempo with a cleaner, less busy arrangement.

## Standard SFX
Use platform `playCorrect`, `playWrong`, `playLevelComplete`, `playTap`, `playButton`, and `playKeyClick`.

## Game-Specific SFX
- `playFootstep`: short soft tap for each traced segment.
- `playCheckpoint`: light chime when reaching a checkpoint.
- `playFinish`: small crowd/finish flourish on correct answer.
- `playEnergyOut`: descending blip when answer is too short.
- `playSkid`: brief slide sound when answer is too long.

## Implementation Notes
Use Web Audio API synthesis only. No external audio assets required for v1.
