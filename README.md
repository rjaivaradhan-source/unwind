# Unwind

A free, local desktop playground for Windows and macOS. No account, ads, analytics, or paid features. Original UI and procedural artwork; MIT licensed.

## Play

On Windows, use the installer in `release/` or the portable executable. For an immediate browser version, open `index.html`; it has no network dependencies.

- The workday: capture your actual screen as a destructible still replica, or load a screenshot. Capture controls exist only on this page. Use Clear snapshot to discard the image from the playground.
- Bubble wrap: pop and reset a sheet of bubbles.
- Glass garden: scatter pastel glass tiles.
- Vent Buddy: create a fictional character with a name, skin tone, shirt colour, hair, and expression, then use 3D Slap and Punch tools with spring reactions and comic feedback. No photos, blood, or injury imagery.
- The buddy runs from every other tool, hides in a box while chased, and returns after play stops with a friendly check-in. Punch uses two red boxing gloves and alternating jab/cross combinations.
- Vent Buddy now uses an original photorealistic fictional adult cutout, and Slap uses an original photorealistic open-hand cursor. Both assets are bundled locally and processed into clean scene cutouts at startup.
- Bug Swarm renders about 1,000 moving canvas bugs, removes them under every tool, tracks the cleared count, and continuously lets new bugs crawl in.
- Bug Swarm uses four detailed beetle-like sprites with shaded shells, segmented bodies, legs, antennae, and varied sizes. Cleared bugs leave flattened squish remains that fade away after five seconds.
- Import a PNG, JPEG, or WebP up to 20 MB to play with a local copy. Nothing is uploaded or overwritten.
- Fourteen tools: hammer, laser, paintball gun, gravity, chainsaw, machine gun, flamethrower, stamp, termites, Restore Potion, baseball bat, grenade, slap, and punch. Click or hold and drag.
- Fullscreen now targets the whole playground so scene tabs, all tools, intensity, and Fresh start remain available around the expanded canvas.
- Installed builds use Electron's native window fullscreen API and keep the playground layout synchronized when entering, leaving, or pressing Escape. Browser previews retain the standard Fullscreen API fallback.
- Installed NSIS builds check the official GitHub Releases feed after launch and every four hours. The Updates button lets players check manually, choose when to download, watch progress, and choose when to restart and install. Updates are never installed without that final user action.
- Chainsaw cuts a continuous diagonal line through the entire playground surface and releases every fragment intersecting that edge-to-edge path.
- Light and dark modes can be switched from the top header and remain available in fullscreen; the choice is stored locally and restored at the next launch.
- The realistic character cutout now receives stronger white/checker background cleanup. Any tool other than Slap or Punch makes the character run and fully vanish before returning after play stops.
- Every tool has an unlimited session-use counter designed to pass 1,000 activations. Visual history retains up to 1,200 persistent marks and 2,400 particles while expired transient effects are recycled for stable performance.
- Bubble Wrap is endless: popped bubbles reform automatically after 1.2–3.2 seconds, while the cumulative pop counter continues beyond 1,000.
- Text contrast is strengthened across light and dark modes. Workday capture copy, privacy guidance, stage labels, instructions, counters, inactive controls, and footer text use higher-contrast colours or translucent backplates where the canvas can vary.
- Hammer now uses the supplied high-detail electric fantasy hammer artwork as a cleaned local cursor asset. The head is aligned to the impact point, with a heavier swing, blue electrical glow/arcs, shock rings, and matching blue debris particles.
- Gravity uses the supplied glowing energy orb artwork with a rotating ring field, cyan bloom, orbiting particles, and responsive pull animation.
- All active cursors use lightweight procedural 3D-style models with top/side faces, material gradients, highlights, contact shadows, and animated moving parts. The raised tool-tray buttons use matching depth and pressed states.
- The flamethrower shows a live flame cone, glowing flame particles, embers, scorch marks, and smoke-darkened areas. The Restore Potion shows animated water jets, blue droplets, splash rings, and repairs the surface beneath the spray.
- The 3D baseball bat uses a broad swing arc, wood impact sound, stronger impulse, and wide debris throw. The 3D grenade bounces with a 1.45-second fuse before producing layered blast audio, a flash, shock rings, fire, smoke, a crater, and radial fragment physics. At most eight grenades can exist at once.
- The premium Tool Vault uses a six-column desktop layout, responsive four/three-column breakpoints, raised instrument cards, material-specific active colors, selected-tool indicators, and a refined control surface.
- 1–9 and 0 select the first ten tools; B selects the bat, G the grenade, S slap, and P punch. R resets. M toggles sound. F enters fullscreen; Escape exits.
- Termites nibble autonomously for 14 seconds (capped at 36 insects). The Restore Potion restores original fragments and bubbles, erases nearby marks, and removes termites. Reset clears all effects and insects.
- Focus the canvas and use arrow keys to position the tool, Space to use it.
- Gentle mode softens audio, removes shake/flash, and reduces fragment motion. OS reduced-motion preference is respected initially.

This base simulates destruction of a screen snapshot in its own window. Capture is initiated only by a button click. In the browser, select a screen or window in the system sharing picker; the stream stops immediately after one frame is copied. To avoid capturing the browser itself, choose a different window or display, or load a screenshot. In the desktop app, choose a display; the app minimizes briefly before capturing it and restores afterward. macOS may require screen-recording permission. Screenshots stay in memory: no uploads or automatic file writes. The app does not modify real windows or documents, and makes no medical claims about stress relief.

Sound effects are synthesized locally with layered transients, low impacts, filtered noise, resonant glass debris, plastic pops, wet paint splats, wood impacts, metal movement, blast layers, stereo positioning, short generated room ambience, and dynamic compression. They are not recorded Foley samples. Gentle mode reduces their strength.

## About and inspiration

Unwind was created and directed by Vivek and was inspired by the spirit of classic desktop-destruction games, including the old Desktop Destroyer style of play. It is an independent project with original code, interface, artwork, effects, and sound design, and is not affiliated with any earlier game. See `about.html` for the full attribution and plain-language licensing summary.

## Develop

Requires Node.js and npm. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm start
```

Browser preview: `npm run preview`, then open `http://127.0.0.1:4173`.
Syntax checks: `npm run check`.

## Package

Windows x64: `npm run build:win` produces an NSIS installer and portable executable.

On a Mac: `npm ci`, then `npm run build:mac`. Build and test on the intended Apple Silicon / Intel architecture. DMG packaging is configured but is not verified by the Windows build. For a public macOS release, obtain Apple signing credentials and notarize the build. Windows public distribution also needs a trusted code-signing certificate to reduce security warnings. No signing credentials are included.

The current Windows artifacts are unsigned development builds. Do not describe them as a signed or store-approved release.

## Publish an update

Installed app updates are delivered through GitHub Releases rather than by pulling the source repository. Update `package.json` to a higher semantic version, commit the change, then create and push a matching tag:

```sh
git tag v1.5.0
git push origin main
git push origin v1.5.0
```

The public repository lets installed copies check for updates without GitHub accounts or access tokens. The included GitHub Actions workflow builds the Windows NSIS installer and uploads the installer, block map, and `latest.yml` metadata to the matching release in `rjaivaradhan-source/unwind`. All three files must remain attached to the release. Automatic updates apply to the installed NSIS edition; portable builds should be replaced manually.

## Next: HD upgrade

Keep the base mechanics and packaging stable, then replace procedural tool cursors with original high-resolution artwork, improve fracture patterns and debris physics, add layered sound design, and introduce richer laser/paint/gravity animations with quality settings. Test performance and reduced-motion behavior before release.

## Base limitations

- Resizing the window, entering fullscreen, or changing scenes starts a fresh canvas.
- No save system; a session is intentionally temporary.
- Fractures use small rectangular tiles; HD fracture geometry is a later upgrade.
- On bubble wrap, destructive tools pop bubbles; paint and stamps mark the surface, termites nibble, and the Restore Potion restores bubbles.
- The macOS build and the Windows installer/uninstaller flow need platform-specific validation before public distribution. Native capture has not yet been exercised because native startup fails in this execution environment.

