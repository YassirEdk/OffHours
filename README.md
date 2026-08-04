# Ink Bloom

# Summary

A dark, scroll-driven landing page built on one continuous generative background. A fixed full-bleed canvas renders ink dispersing in water from noise rather than from a video or an image sequence, and scroll position drives the field, so eight full-viewport sections all float over a single uninterrupted shot. The centrepiece is a full-bleed before and after: two complete renderings of the same screen, the generic default and the designed version, with a divider that wipes between them as you scroll. Oversized grotesk type driven on its variable width axis, monospace metadata, one accent per section. Good for AI tools, developer products and anything whose pitch is a visible quality difference.

# Style

Near-black graphite ground with warm white ink and four saturated accents used strictly one per section. The colour never sits in flat fills, it arrives as dye blooming through the background film, so the page changes temperature as you scroll instead of changing skin.

## Spec

Apply a dark generative editorial style. Palette: ground #0A0B0C, ink #F5F3EF, muted ink rgba(245,243,239,.62), and four accents used one per section, acid #D8FF3E, orange #FF5C38, cyan #6FE3FF, magenta #FF3D9A. Never use more than one accent inside a single section. Display face: a grotesk with a variable WIDTH axis, and use that axis as a real device rather than only weight, 125% for display, 78% for condensed sub-heads, 90% for card names, all at weight 900, uppercase, line-height 0.86, letter-spacing -0.012em. Body in a neutral sans. Every small label, index, spec line and eyebrow in monospace, uppercase, letter-spacing 0.14 to 0.2em, at 0.6 to 0.72rem. Number the sections 01 to 08 in monospace with a 56px hairline rule beneath that scales in from the left. Give body copy a soft dark text-shadow so it survives passing over a bright bloom. Over the background put a static screen-blend caustic pattern, a fixed vignette, and an overlay-blend SVG feTurbulence grain at about 5% opacity, and do not animate any of the three.

# Layout & Structure

Eight full-viewport sections over one fixed background. The cover is centred on a vertical spine, the middle sections pin their blocks to uneven corners, one section goes completely full-bleed with no margins, and two sections hold with CSS sticky while a scrubbed animation plays.

## Navigation

Fixed bar, transparent, monospace uppercase at 0.68rem with 0.16em tracking. Wordmark left in the display face at width 125%. Links right, each preceded by a middot, at 78% opacity, with a 1px underline that scales in from the left on hover using cubic-bezier(.6,0,.2,1). Below 820px hide all links except the last.

## 01 Cover

Centred spine, not a left-pinned mast. Stack the wordmark on two lines at clamp(2.8rem,10.5vw,9.5rem), the second line in the first accent. Under it a condensed tagline at clamp(1.4rem,3.2vw,2.4rem) held to a single line, with its two opposed nouns coloured — the one being sold in the section accent, the one being refused in the accent furthest from it. This and the close are the only places a section carries two accents at once. Then one paragraph at 46 characters wide. Pin the section index centred at the bottom, and a small rotating circular-text badge bottom right whose rotation is driven by scroll, not by an idle loop.

## 02 The argument

Asymmetric and deliberately unbalanced against the centred cover. Bottom left, a two-word display kicker at clamp(2.6rem,10vw,8rem) with the second word in the section accent, and a monospace spec line under it. Top right, right-aligned, the section index, one paragraph at 38 characters, and a wrapped row of pill chips that invert to solid on hover. Put a soft gradient scrim over the right half so the right-aligned text holds.

## 03 The difference

The only full-bleed section, no padding container, edge to edge. Stack two absolutely positioned panes that each render the SAME screen. The lower pane is the generic default: an indigo to violet gradient, everything centred, one type size, a three column row of identical cards with emoji icons, translucent white fills and 1px borders, and a white pill button. The upper pane is the designed version of the same content: the near-black ground, a display headline with one accent word, and three ranked rows carrying a monospace index, a name and a right-aligned note, separated by hairline rules instead of boxed into cards, plus one accent button. Anchor the default content to the left half and the designed content to the right half so neither pane empties as the divider moves. Hold the section with CSS sticky over 180vh and scrub a clip-path inset on the upper pane from 72% to 24%, with a 1px vertical divider and a small circular handle tracking the same value.

## 04 The offer

A vertical rotated title down the far left using writing-mode vertical-rl. An intro block top right, right-aligned. Three cards along the bottom, stepped up to the right with increasing bottom margins of 0, 5vh and 10vh, on a 900px perspective. Each card: translucent dark fill with an 8px backdrop blur, a 3px accent bar across the top, a monospace eyebrow, an accent name in the display face at width 90%, a description, a monospace spec line, and a footer row above a hairline. Bleed a large ghost numeral off the bottom right corner of each at 12% opacity.

## 05 The position

220vh tall with a sticky 100vh box. One centred sentence at clamp(2.2rem,5.8vw,5rem) with line-height 0.94, split to words that each start at 0.1 opacity and 0.35em low. Scrub them up and in one at a time across the section, then bring an attribution line up underneath.

## 06 The index

A two column strip: a count-up statistic on the left with an accent phrase inside it, and six rows on the right. Each row is a display name with a right-aligned monospace note on the same baseline, separated by hairline rules. On hover, fill the row with the warm white from the bottom using a scaleY transform, invert the text to the dark ground, and slide the name 10px right.

## 07 The spec

Change register once before the close. A short headline, then three columns of dense monospace key-value pairs under a full-width hairline, each pair a label left and a right-aligned value, separated by faint rules. Put a dark linear scrim behind the whole band so it stays legible over the background film.

## 08 The close

Centred. A display line whose last word is split across all four accents, one paragraph, a large accent pill button whose secondary fill slides up from below on hover while the arrow shifts right, and a monospace contact line with underlines that extend on hover. Give this section its own radial scrim, since the background is at its brightest here.

## Footer

A single row: the wordmark in the display face, a one line description, and a copyright, all monospace except the wordmark, over a gradient from transparent down to near-black.

# Special Components

## Generative ink film (the signature)

A fixed full-bleed canvas that generates the background instead of playing a video or an image sequence. Scroll drives the field, so the whole page reads as one continuous shot, and it costs nothing at rest.

Render into a small offscreen buffer, about 200 by 113 pixels, and upscale it to the visible canvas with image smoothing on. The upscale is what gives the dye its soft edges, do not render at full resolution. Per pixel: take two cheap value-noise samples to build a domain warp, then sample a four-octave value-noise field at the warped coordinate. Threshold that field TWICE, once tight for a dense core and once loose for a soft outer skirt, and blend both toward the accent colour. A single hard threshold draws an iso-contour outline around every shape and reads as a topographic map. Add a slowly drifting radial bias so a dense bloom is always somewhere on screen, otherwise some scroll positions render nearly empty. Shade the plumes using one of the warp samples so a saturated shape still has a near and a far side. Bake the static water base into a float array once at startup rather than recomputing it every frame. Map scroll 0 to 1 onto the field's z and flow offsets, lerp toward the target, snap when the delta is tiny so it stops redrawing entirely at rest, and gate the redraw on both a meaningful delta and a frame interval. Use an integer hash into a precomputed random table for the noise, not trigonometry, since there are dozens of samples per pixel.

## Section-anchored hue ramp

The dye colour walks the accents as you scroll, and each section genuinely owns its colour.

Interpolate the accent colour in HSV with shortest-arc hue, never channel-by-channel in RGB. Orange to cyan in RGB passes straight through grey and drains the entire page at every section boundary. Anchor the ramp stops to each section's real centre expressed as a fraction of total scrollable height, computed on load and on resize, not to evenly spaced positions. A tall sticky section otherwise has its colour change land a full screen away from the section it belongs to.

## Scroll-wiped before and after

Two complete renderings of the same screen with a divider that scrubs between them, so the page demonstrates its own argument rather than describing it.

Stack both renderings absolutely inside a sticky box, clip the upper one with clip-path inset(0 0 0 var(--wipe)), and scrub --wipe from 72% to 24% across the section with a scroll-linked tween. Position a 1px full-height divider at the same var(--wipe), with a 38px circular handle centred on it. Anchor each pane's content to its own side of the frame, otherwise the pane that is being covered turns into an empty rectangle instead of a comparison.

## Character-mask headline reveal

Every display headline swings up out of a mask instead of fading in.

Split each headline to characters, wrapping each WORD in an inline-block with overflow hidden and each character in an inline-block inside it. Give the word mask a little vertical padding with equal negative margin so descenders and accents are not clipped. Animate the characters from yPercent 112 and a 5 degree rotation to zero, duration about 1.05s, stagger 0.022s, power4.out, triggered when the section reaches 72% of the viewport.

## Scroll-velocity skew

The whole content plane leans into the scroll and settles back to flat.

Apply skewY to the wrapper that holds every section, driven by smooth-scroll velocity, clamped to about 2.2 degrees, using a quick-setter with a 0.5s power3.out so it settles to zero at rest. Because this wrapper is permanently transformed, position:fixed will not work inside it, so hold both pinned sections with CSS position:sticky rather than a pin utility.

## Cursor dye bloom

A soft tinted bloom trails the pointer and takes on the colour of whichever section is on screen.

A 520px fixed radial-gradient circle with mix-blend-mode screen, following the pointer through a quick-setter with about 0.9s of easing so it lags rather than tracks exactly. Give each section a data attribute holding its accent as an rgba value and swap a CSS custom property when that section crosses the middle of the viewport. Only enable it for fine pointers, and hide it entirely on coarse pointers and under reduced motion.

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
