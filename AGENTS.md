# Project boundary

This is the new standalone Three.js edition of まんまるぶうの冒険.

Never inspect, import, or use the code, scenes, settings, or game design in
`C:\Users\rukat\manmarubuu-project`.
The sole permitted exception is Blender models and existing animation assets
inside `C:\Users\rukat\manmarubuu-project\models`.
Do not change the original asset files; export derivatives into this project.

Complete a playable game loop before visual polish. Run relevant logic tests,
the production build and a bounded functional browser smoke check. Do not start
a screenshot/tweak/screenshot iteration cycle. Once the loop works, present it
to the user for visual and feel review before further polishing.

Use `npm run check` and `npm run test:smoke` (with the dev server running).

## Current chapter (2026-09-26)

The user authorized replacing the old seed-collection game completely.
The active design is `docs/SEALED_SHRINE_DESIGN.md` plus
`docs/COMBAT_PROGRESSION_SPEC.md` and `docs/SEALED_SHRINE_IMPLEMENTATION.md`.
Always call the protagonist まんまるぶう, never abbreviate the name.

The user explicitly added one narrow asset exception:
`C:\Users\rukat\manmarubuu-project\game\audio-library` may be read and copied.
This does not authorize reading any other original game files. Keep originals unchanged.
Sound quality is accepted; check duration and levels only. No listening/quality review.

The 2026-09-27 feedback authorizes necessary screenshots for targeted fixes.
Use a bounded visual check of the reported problems; do not repeat screenshot/tweak loops.
The user still owns final feel, real-device performance and difficulty review.

Latest requirements supersede the rabbit-NPC design: use animated human fantasy
assets, seamless walk-in houses with hinged doors, Space to jump, terrain relief
and distant landscapes, visible equipment removal/transmog controls, continuous
battle facing, unobstructed command cameras, enemy notice/chase/flee AI, and clear
objective and rotating-disc guidance. Never inspect original Unity code for AI.

The latest art direction is bright, warm, stylized fantasy: white plaster and
timber buildings, individual oversized roofs and towers, rich grouped greenery,
painted terrain and soft light with fog/AO. Do not replace it with photographic
ground or photorealism. Preserve the original Blender pink on the nose, hands
and feet; bake procedural colors into derivatives instead of accepting white
glTF defaults. Keep eye thread matte and readable when fur quality changes.

The latest opening is a disappearance ten days before arrival. Remove the live
abduction scene and keep Lily out of the village until the homecoming. Preserve
old saves by migrating abductionSeen to abductionKnown. M opens the full local
atlas; the lower-right minimap shows position and facing. Victory rewards are
settled before the acknowledged results panel, including story EXP and loot.
The user visually approved chest placement and battle scenery; preserve them.
