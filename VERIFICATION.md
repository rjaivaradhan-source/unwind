# Base release verification

## 1.1.0 changes

Replaced the procedural hammer cursor with a cleaned, recomposed version of the user-supplied electric hammer image. Browser screenshots verified background removal, scale, pivot alignment, and visibility on Glass Garden. A live impact verified counter and scene feedback with no console errors.

## 1.0.1 changes

Completed a contrast and readability pass across both themes, concentrating on “Your screen. Your playground.” and its privacy/capture guidance. Browser screenshots verified readable Workday title, subtitle, notices, stage instructions, tool labels, counters, settings, and footer text in light and dark mode. No console errors were reported.

## 1.0.0 changes

Added per-tool unlimited activation counters, raised retained visual capacities above 1,000, and made Bubble Wrap regenerate indefinitely with a cumulative pop counter. Browser testing verified counter increments, bubble pop counting, bubble regeneration after the delay, repeat popping of the same area, and zero console errors. Simultaneous heavy-object caps remain for stability, but lifetime uses are unlimited.

## 0.9.0 changes

Added detailed cached bug sprites, five-second squish remains, persistent light/dark mode, stronger character background cleanup, and full disappearance during non-hand-tool chases. Browser tests verified bug clearing, visible squish remains, expiry timing, dark mode, persistence through reload, chase/vanish/return messaging, and the clean realistic character in dark mode. No console errors were reported.

## 0.8.0 changes

Replaced the procedural Vent Buddy and slap cursor with original realistic generated assets and added fast local background cleanup. Changed chainsaw collision from a local radius to an infinite-line intersection across the stage. Browser screenshots verified the clean realistic character, realistic moving hand, and an edge-to-edge chainsaw cut releasing every intersected glass tile; no console errors were reported.

## 0.7.0 changes

Added a continuously replenishing 1,000-bug scene, paintball gun model, two-glove punch combinations, Vent Buddy chase/hide/return behavior, and a whole-playground fullscreen layout. Browser tests verified bug clearing and replenishment feedback, paintball selection, buddy return message, alternating combo feedback, visible tool/reset controls, and zero console errors. The embedded preview host did not grant fullscreen entry, so actual fullscreen entry still needs a normal Chrome/Electron smoke test; the fullscreen CSS and target container are in place.

## 0.6.0 changes

Added the Vent Buddy character creator and 3D Slap/Punch tools. Verified locally in Chromium: custom name, hair, and expression save correctly; the fictional buddy renders in its dedicated studio; slap and punch select and trigger spring physics, comic feedback, session counts, and synthesized sound paths; no console errors were reported.

## 0.5.0 changes

Added 3D baseball bat and grenade tools. The grenade was verified end-to-end in the browser: selection, throw, bounce/fuse delay, blast feedback, debris, crater, and session message all worked without console errors. The premium 12-tool vault was visually inspected at the default desktop size. Sound code executes through user-initiated interactions; subjective realism and speaker loudness still require listening tests.

## 0.4.0 changes

All ten active tool cursors were replaced with procedural 3D-style canvas models. The flamethrower flame cone/particles and washer model/water path were visually inspected on Glass garden. The tool tray's raised/pressed 3D styling was also inspected. JavaScript syntax checks pass and no browser console errors were reported during the fire and washer checks.

## 0.2.0 changes

Verified in the local browser: capture controls are scoped to The workday; Bubble wrap and Glass garden retain their scenes; a local fixture image loads into The workday, can be destroyed, and can be cleared. New layered bubble/impact sound code executes without console errors. Sound realism/loudness has not been subjectively evaluated. System screen-picker capture and native desktop capture still require hands-on validation. The previously documented native startup limitation remains unresolved.

## 0.1.0 baseline

Verified in the Chromium browser preview on Windows:

- Workday hammer destruction updates visible feedback.
- Bubble-wrap clicks pop bubbles and update the count.
- Reset clears destruction and restores the initial message.
- All three scene tabs and all four tool selections work.
- Laser drag cuts glass, paint click/drag produces visible splats.
- Gravity input exercised; selection verified. Fine-grained physics still needs hands-on feel testing.
- Sound and gentle-mode toggles update state. Audio quality is not subjectively verified.
- Local image import succeeds using the app's own PNG icon as a fixture.
- Help dialog opens and closes.
- Fullscreen enters and exits.
- Keyboard arrow/Space play updates destruction feedback.
- No errors or warnings in the browser console during these checks.
- Layout inspected at the default viewport and a 900×700 desktop viewport.
- JavaScript syntax checks pass; npm dependency audit reports zero known vulnerabilities at build time.

Windows x64 NSIS installer and portable EXE were successfully built with Electron 44.1.0 / electron-builder 26.15.3. They are unsigned (confirmed with Authenticode inspection).

## Native startup limitation

The unpacked Windows app did not start successfully in the Codex execution environment. Electron reports GPU and renderer process launch failures with child exit code `-1073741515` and final exit `-2147483645`. Disabling GPU acceleration for a diagnostic run did not resolve it. The packaged DLL set matches the downloaded Electron archive, but the exact cause has not been established. Do not call native startup, installation, or uninstallation verified. The installer should receive an ordinary desktop smoke test before public release.

## 1.4.1 fullscreen and Gravity update

The installed app fullscreen control now invokes Electron's native `BrowserWindow.setFullScreen()` through a context-isolated preload bridge. Enter/leave events synchronize the fullscreen playground class and controls, including Escape-based exit. Browser builds keep the element Fullscreen API fallback. JavaScript validation passes. Native smoke execution remains blocked in this sandbox by the GPU process failure documented above, so the packaged build should be exercised on a normal Windows desktop. Gravity now uses the supplied energy-orb image with runtime background cleanup, responsive sizing, rotating energy rings, glow, and orbiting particles.

## 1.5.0 opt-in updater

The installed NSIS build uses `electron-updater` with the public `rjaivaradhan-source/unwind` GitHub Releases provider. Automatic downloading and automatic installation are disabled. The app checks after launch and every four hours, reports availability through the Updates button and an in-app notification, and requires separate user actions to download and restart/install. The release workflow publishes the installer, block map, and `latest.yml` metadata on `v*` tags. Browser previews report that updating is available only in installed builds. Portable builds remain manual updates.

macOS DMG generation is configured, but has not been built or tested on this Windows host. macOS signing/notarization and Windows trusted signing remain outstanding for public distribution.
