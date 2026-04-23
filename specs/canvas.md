# Canvas & Scene - Perimeter Explorer

## Rendering Technology
Use SVG for the track, points, edge labels, runner position, and report diagrams. SVG gives stable coordinates for tracing and PDF capture.

## Viewport / ViewBox
Responsive full-screen canvas with `viewBox="0 0 1000 620"`. Keep the active track inside a safe area from `x=90..910`, `y=80..520`.

## Coordinate System
All generated shapes use normalized SVG coordinates. Logical edge lengths are independent from pixel length so diagrams can be readable while values remain curriculum-appropriate.

## Scene Layers
1. Park background: grass, path texture, subtle trees/playground shapes.
2. Track outline: thick rounded outer boundary.
3. Edge labels: metric values attached to segments.
4. Checkpoints: touch targets at vertices.
5. Runner: sporty cartoon kid sprite positioned on current edge.
6. Trace effects: glowing completed segment and animated footprints.
7. HUD overlay: lap-total panel and current segment.

## Key Visual Objects
Runner wears bright sport clothing and has simple running frames. Checkpoints are small finish-flag posts. Completed edges turn bright green. Untraced edges stay neutral grey.

## Pointer Interaction
Dragging begins at the active checkpoint. The next legal checkpoint pulses. Dropping on the correct next checkpoint advances the runner and adds the segment. Incorrect drops snap back with a soft wobble.

## Secondary HUD Elements
The lap-total panel shows entries such as `8 m + 12 m + 8 m = 28 m`. In Level 1 it is always visible. In Level 2 it fades after early questions. In Level 3 it appears only after submission/review.

## Scene Capture Notes
Report cards should capture the shape diagram with labels and highlighted correct boundary. For wrong answers, include the original prompt diagram, not the feedback animation.

## Square Snip Usage
Use the dev snip tool to capture a centered square thumbnail of the current track for social images and a 70 x 42 mm report diagram crop.
