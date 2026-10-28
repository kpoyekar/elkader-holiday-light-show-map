# Elkader Holiday Light Show — interactive map

A static site. No server, no database, no build step for the page itself — it
runs on any web host, including GitHub Pages.

## Look at it on your computer

The map won't load if you just double-click `index.html` (browsers block local
files from loading each other). Run a tiny server from this folder instead:

```bash
python3 -m http.server 8771
```

Then open <http://localhost:8771/>. Ctrl+C in the terminal stops it.

## Where it lives on GitHub

This folder is a git repository of its own, and it is on GitHub as
`kpoyekar/elkader-holiday-light-show-map`, published with GitHub Pages at

    https://kpoyekar.github.io/elkader-holiday-light-show-map/

That is the link to show people the map before it goes on the City's site.
Only this folder is in git — nothing outside it, so the participants
spreadsheet and the rest of `_build/sources/` never go near GitHub. The repo
is public, because Pages needs it to be; everything in it is already meant
for the public page. The font files are in it, as they are in the Art in the
Park repo.

To put a new build up, from this folder:

    git add -A
    git commit -m "v82: what changed"
    git push

Pages rebuilds on its own in a minute or so. Run `stamp.py` first, so the
stamp and the asset keys match what you are pushing.

## What to upload

Everything in this folder. Nothing outside it is needed at runtime.

```
index.html      the page
style.css       all styling
app.js          pan, zoom, markers, search, text layer
data.js         the 60 displays and all 177 labels — GENERATED, see below
assets/
  map.svg       the artwork — vector throughout, no lettering, no raster
  k8ki-logo.svg sponsor wordmark (K8Ki-Saffron from the brand logo kit)
  show-logo.webp  the show's own logo, at the top of the list — GENERATED
  logos/        43 participant logos, shown on the detail card — GENERATED
                (49 of the 59 markers show one)
  fonts/
    proxima-nova-regular.woff2          the page's typeface, 30 KB
    proxima-nova-bold.woff2             its bold, 31 KB
    glacial-indifference-subset.woff2   the fallback while those load, 3.5 KB
```

## Running the build scripts

The page itself needs nothing installed. The scripts in `../_build/` do —
PyMuPDF to read the Canva PDF, Pillow for the logos — and macOS refuses to
install either into the system Python. There is a virtualenv for them at
`~/.venvs/elkader-map`, outside Dropbox so it is not synced:

```bash
python3 -m venv ~/.venvs/elkader-map
~/.venvs/elkader-map/bin/pip install pymupdf pillow
```

Then run the build scripts with `~/.venvs/elkader-map/bin/python` in place of
`python3`. Only `build_data.py` and `vectorise.py` need PyMuPDF; the logo and
link scripts import `build_data` for its name table alone, and that import no
longer drags the PDF toolchain in with it.

## Source

Everything is built from **page 2** of the Canva file "Holiday Light Show MAP
2026" — the revised version, with full business names, paired spots merged into
one label, and no QR code, logo or internal notes. Page 1 is the older layout
and is not used.

## How it's put together

Four layers, bottom to top:

1. **The artwork** — `assets/map.svg`: the Canva map with the lettering
   stripped out, every shape vector. Route, river, buildings, trees, direction
   arrows, signs, sheds, the railroad, the landmark icons: all of it.
2. **The bulbs** — one Christmas bulb per spot, 60 of them, drawn as vector.
3. **The lettering** — the business names and landmark labels, drawn as SVG
   text from coordinates read out of the Canva file, in the map's own
   typeface. Sits above the bulbs so a name is never hidden by one.
4. **The markers** — one button per business, each opening a card with the
   name, the logo and the links. A business with two spaces has a single label
   on the map reading "5 & 6", so it gets one marker over its two bulbs.

### Picking a business lights its bulb

Choosing a name — from the list or by tapping the map — lights that bulb until
something else is chosen. From the list especially, the bulb can be anywhere
on the map, and without it there is nothing saying which of the sixty was
meant.

**The bulb does not move and does not blink. Only the light does.** A pool of
the bulb's own colour fades up behind it and then breathes, the way a lit bulb
spills onto paper. The bulb itself holds perfectly still.

**Hovering a bulb warms it** — the same pool of its own colour, held low and
still at half strength, so it reads as "this one" without competing with the
chosen bulb's breathing light. The marker is an invisible hit area over the
artwork and the bulb is drawn in another layer, so CSS alone cannot join
them: `warmBulb()` puts the class on by hand, and the rule sits behind
`@media (hover: hover)` — on a touch screen a hover sticks after the tap and
would leave bulbs lit behind you. Keyboard focus warms it too.

That distinction is the whole thing. A swelling or flashing bulb reads as a
warning light and is tiring to sit beside — it was tried both ways, and both
were wrong. Light moving around a still bulb reads as one that is lit. The
breath is shallow on purpose, and eased at both ends so it glows rather than
blinks, since it stays on screen for as long as the card is open.

The pool is a real radial gradient, one per bulb colour — seven across sixty
bulbs — rather than a stack of blurred shadows. Light falling on paper falls
off smoothly, and a blur wide enough to cover this much ground goes grey and
flat. The circle sits inside each bulb's wrapper but outside its transform,
so it is in the map's own coordinates; the transform belongs to the artwork
inside it.

A lit bulb is moved to the end of its layer. SVG has no `z-index`: later
siblings paint over earlier ones, so in the crowded stretches the light would
come up underneath its neighbours. The lettering still sits above, in its own
layer, so a name is never covered.

Canva places the bulbs and the numbers as separate things with nothing linking
them, so `build_data.py` ties each bulb to the spot whose number is printed on
it, by position. 59 of the 60 tie; the odd one out is 56, which has a bulb and
a number but no business.

That tie is also what lets the panel carry the bulb colours. The colours live
on the bulbs and the numbers live on the spots; without the join there is
nothing to look them up by.

### Spots with no name yet

`UNNAMED` in `build_data.py` holds the spots whose participant is not settled
— 56, where Julie Doeppke pulled out, and 60, where Ethan Koehn Construction
is coming off. The bulb, the number and the marker all stay: the display is
there and its number is printed on it. What goes is the name, from the map and
from the list, along with any logo and links that spot had.

On the map itself they say **AVAILABLE** where that spot's business name sat
— `build_data.py` keeps the slot as it drops the name, so the word lands
under the bulb for one and beside it for the other, both laid out by hand in
Canva around their neighbours. An offset from the bulb would have to guess at
that, and did: at +9 it sat on the bulb.

`TAG_CLEAR` then stands it 7 units further off the bulb than the name stood,
along the line from the bulb to the middle of where the name was — so a name
that sat below pushes down and one that sat alongside pushes sideways. A
business name is a block of several words and reads as belonging to its bulb
from close up; one word in capitals beside it looked stuck to it. It flashes on a 1.4s cycle — gently, since it sits on screen the
whole time the map is open, and not at all for anyone who has asked for
reduced motion. In the list and on the card they are not blanks either — they
are **spots for sale**. The row reads
"Available spot" in a quieter hand than a business name, and the card offers
the spot with a **Book now** button straight to Ketaki's Stripe checkout.
`BOOKING` in `build_data.py` holds the wording and the link, and the spot
carries `free: true`.

The name itself stays empty in the data, and that is deliberate twice over: an
empty name is what keeps two free spots from merging into one row
(`groupSpots()` keys them by index, and the build's pair checks skip them), and
it is what guarantees a withdrawn business's name cannot find its way back onto
the page. The page words them from `BOOKING`; the data never names them.

The exact wording of the name being removed is listed, so if the Canva text
changes the build stops and says so rather than quietly leaving a name on a
published map.

### Eight participants have two spots

Peace Church has 5 and 6, Alpine Communications 12 and 13, MercyOne 15 and
17, Pattison Sand 20 and 22, Brown's 23 and 25, EXIT 24 and 26, St Joseph 51
and 52, CJ Moyna 57 and 58. Most of those pairs are **not** consecutive, and
the two markers have different ids, so nothing in the data ties them together
except the name — which is what `groupSpots()` in `app.js` groups them by.

They are one participant with two displays, so everywhere a person reads a
name they are one thing:

* **one row** in the list, carrying both bulbs side by side — listing the
  same name twice read as a duplicate rather than as two displays
* **one card**, carrying both bulbs and saying "Spots 5 & 6"
* **both bulbs light** when either is chosen, however far apart they sit
* **Previous / Next** step between participants, so a pair does not show the
  same card twice over

The markers on the map stay one per spot. The map says where each display
actually is, and that does not change.

### One number on the page: 50 displays

The header and the count under the show logo both read **50 displays**.

Counted in participants, called displays — Ketaki's wording. A business with
two spots is one row in the list and counts once, and the two spots still to
be settled are nobody yet, so they are shown but not counted. The map itself
carries 60 numbered bulbs, which is a different thing and not a number the
page prints anywhere.

The card carries no total at all, only which bulb to look for: "Spots 12 &
13". It used to carry its own position in the list, which put two totals on
one screen counted two different ways. They were counting two different
things and both were right, but nobody reading a map wants to work that out:
it reads as a mistake.

`PARTICIPANTS` in `app.js` counts distinct non-empty names straight out of
the data, because a number written into the page by hand went stale the
moment somebody pulled out.

### The numbers are bulbs everywhere

In the list and on the card, a spot's number is drawn as its own bulb — the
same three traced paths the map uses, filled the same way, with the number
over the glass. The thing you pick in the panel is the thing you are hunting
for on the map, rather than a separate piece of styling that has to be kept
in step with it.

`bulbChip()` in `app.js` builds one. The number sits at the glass's widest
point rather than its centre, since the bulb is pear-shaped; a label longer
than two characters is held to the glass width instead of running over the
edge. A participant with two spots gets two chips rather than one chip
reading "5 & 6" — `.list .n` and `.card-n` are flex rows, not centred grids,
so a pair sits side by side instead of stacking.

The chips are `aria-hidden` and each list row carries an `aria-label` reading
"Spot 3: Elkader Chiropractic Center" — or "Spots 5 & 6: Peace Church" — so
nothing is lost to a screen reader by the number becoming a picture.

Hovering a row lights its bulb rather than filling a box behind it — the bulb
is already the right colour, so there is nothing left to tint.

### No direction arrows, for now

The map carries no chevrons. The artwork's twenty-two static clusters are
lifted out by `optimise_svg.py` (`CHEVRON_FILL`), and the moving conveyor of
chevrons that replaced them for a while is gone too: Ketaki asked for it to
come out and will say what goes in its place. One green shape stays: the
curved U-turn arrow at the junction of 42–45, which is not a run of chevrons.

What the conveyor needed is still built, in case it is wanted again:
`_build/route_path.py` derives a centreline down the middle of the road from
the traced ribbon (fill, thin, trace, prune the whiskers, rejoin, smooth,
resample) and points each stretch the way Ketaki's own chevrons pointed. It
is written to `routepath.json` and carried in `data.js` as `routepath`;
`chevrons.json` holds the lifted clusters. Nothing on the page reads either.

### The road is Canva's width

`ROAD_GROW` in `optimise_svg.py` can stroke the road's own outline in its own
colour, which grows the ribbon by half the stroke on each side — the only way
to widen a shape that was traced as an outline rather than drawn as a line.
It is **0**. It was 2.4 while the chevrons ran down the road, and the extra
width put the bulbs on the tarmac and pushed the names into each other; the
road is back to the width Ketaki drew.

### Names stay off the bulbs

Two things keep a name from sitting on a bulb.

**At build time**, `RESTACK` in `build_data.py` re-sets the names that are
wrong or too long for where the artwork put them — the full "Whoopsie Daisy
Greenhouse" over two lines rather than three, "EXIT Driftless Group" under its
two bulbs, Brown's over two lines just below 23 and 25 — each with a `dx`/`dy`
worked out against the real text widths in the browser, because the build has
no font metrics. The build also stamps the lines of each name with a group id
(`g`): on the drawn map two neighbours' names sit as close as two lines of one
name, so which lines belong together has to be said, not guessed.

**On the page**, `declutter()` in `app.js` measures every name in the real
font after `document.fonts.ready` and eases off a bulb's face any that touch
it — the face being the number printed on the bulb with `BULB_PAD` around it,
not the whole teardrop (the tip is meant to touch the name) and not the halo.
Only bulbs push: names are not spaced against each other, because a solver
let loose on the whole map rearranges a layout that was made by hand. A move
is kept only if it gets the name fully clear within `CROWD_SHIFT`; otherwise
the name stays where Ketaki put it and is named in the console, to be placed
by hand in `RESTACK`.

### How the artwork became vector

Nothing on this map is a picture of a map. `_build/vectorise.py` drives
VectorCraft over its control channel: it opens the cleaned PDF, traces every
raster in it, and exports one SVG.

Most of the work is Canva's doing. Canva flattens the route, the buildings,
the river and High Street into a single 2000×1545 image, but keeps the signs,
the sheds, the trees and the boundary as real vector — those pass straight
through untouched. What gets traced is that one flattened image, the blue
building rectangles, the railroad, the welcome sign, the mailboxes, the
playground arcs and the K8Ki wordmark.

Two things will bite you here:

**Tell the tracer how many colours to expect.** On its automatic palette it
decides the route grey and the High Street grey are the same grey, merges
them, and the entire route vanishes from the map — with no warning and a
perfectly healthy-looking export. The base is traced with an explicit colour
count (`BASE_COLOURS`), and the build stops if fewer come back.

**The decorative "E L K A D E R" is rendered, then traced.** It is set in
Kompot Display Outline, which we have no licence to ship and VectorCraft does
not have installed — left as text it exports in a fallback face. That one word
is rendered out of the PDF, where the font is embedded, and traced, so the
lettering is exactly as Ketaki set it and no font ships.

Everything else is traced exactly where it sits. Resist the urge to tidy the
stacking order: sending the artwork to the back puts it behind the page's own
white background rectangle, and the map renders blank.

Shapes are traced **overlapping**, not abutting. Abutting shapes share an edge
exactly, and a browser antialiases each side of that edge on its own — so
wherever the tracer has split one flat area into several paths, the seams
between them show as pale slivers along the route when you zoom in. They do
not show in VectorCraft's own renderer, which is a good way to waste an hour.

### The build checks itself

`vectorise.py` finishes by rendering what it made and comparing it, pixel by
pixel, against a render of the PDF it started from. More than 1% disagreement
fails the build and leaves both images in `_build/preview/` to compare.

This matters more than it sounds. Every way this has gone wrong — a colour
merged away, the artwork stacked behind the background — produced an SVG that
opened fine, passed every structural check, and was missing the route. A
rendered comparison is the only check that notices.

### This page is embedded, so nothing may inherit a size

The map is two layers that must line up exactly: the artwork (`assets/map.svg`,
an `<img>`) and the vector overlay above it (an inline `<svg>` carrying the
lettering and the bulbs). Both are set to 1584×1224.

**A host that injects `img { max-width: 100% }` breaks that.** It clamps the
artwork to the container width while the overlay keeps its full size, so the
artwork renders at about half scale in the top-left corner and every label and
bulb floats off it. The preview shell does exactly this, and GoDaddy's page
styles may too. It does not reproduce on a plain local server, which is what
made it confusing: the map looked right here and wrong everywhere it mattered.

`.hls img, .hls svg` therefore reset `max-width`, `max-height`, `min-width` and
`min-height`, and `.canvas` carries an explicit width and height. Don't remove
those — they are load-bearing in the only places this page actually runs.

### Why the layer order needs explicit z-indexes

`.basemap` is an image in normal flow; the text layer is absolutely
positioned. **A positioned element paints above an unpositioned one regardless
of source order**, so without the `z-index` values in `style.css` the layers
can swap places and bury each other.

### The bulbs

**Every bulb is placed by hand in Canva** — position, angle, size and colour.
`build_data.py` reads all 60 placements out of the PDF and the page redraws
them as vector. Nothing in the code decides how a bulb sits; change it in
Canva and rebuild. The caps point at the route because that is how they are
drawn there, not because anything here computes it.

The numbers are ordinary text spans and come through the lettering layer
upright, exactly where Canva puts them, so they stay level on a tilted bulb.

The bulb itself is traced from the artwork as **three separate regions** —
outer silhouette, glass, cap — filled black, then `#868685`, then the bulb's
colour. Tracing one path and stroking it does not work: the trace follows the
*outer* edge of the artwork's black outline, so a centred stroke sits half
outside it and every bulb comes out heavier and larger than the original.

**Two bulbs in five are not just rotated — they are mirrored.** Read the angle
off the transform's x column and those come out backwards, because a
horizontal flip turns that column through 180° while leaving the y column
alone. `read_bulb_placements` takes the angle from the y column and carries
the flip separately as the sign of `sx`.

### Bulb colours: two rules

**No two bulbs within 50 page units of each other share a colour** — about two
bulbs either way along the cord. 12, 13 and 14 all came off the artwork red,
which on the map reads as one smudge and in the list looks like a mistake.

**Except a participant's own two bulbs, which must match each other.** They
are one business with two displays, so they wear one colour. This is why the
exception has to exist: 12 and 13 are both Alpine Communications and sit 24
apart, closer than any other pair on the map, so the first rule would
otherwise be exactly the thing pulling them apart.

**And two spots are hers to name.** 18 is gold — K8Ki's own — and 14 is not
red. `PINNED` holds the first, and the colouring is worked out around it.

`RECOLOUR` in `build_data.py` holds the result — fourteen bulbs given a
different colour, the fewest that satisfy all three rules. The spread stays
even: 16 red, 15 blue, 15 gold, 13 grey. 18 is already gold in the artwork,
which is why it is not in the table; pinning it there is what keeps it so.

50 is as far as the first rule goes. The artwork has four bulb colours and the
bulbs sit about 26 apart, so at 55 a bulb has five others inside the radius
and there is no colouring left to find.

The trace actually returns seven hex values, but three are noise — `#ac685b`
is the same red as `#ac6455`, `#bbbbbb` and `#cdcdcd` the same grey as
`#c7c7c7`, none of them tellable apart on screen. `BULB_PALETTE` snaps them to
the four real colours first, so "a different colour" means a visible one.

**These are the page's colours and the page's alone.** The Canva file keeps
the originals, and Ketaki has said not to change it to match — so a printed
map and this one will differ, on purpose.

Three checks run on every build and fail it rather than shipping something
wrong: `check_bulb_clearance()` for the first rule, `check_pairs_match()` for
the second, `check_pinned()` for the third. The table was worked out against the artwork as it stands; if
Canva moves a bulb the table goes stale, and a stale table is invisible
otherwise.

### Older notes on the bulbs

Ketaki drew seven sample bulbs on page 2; the page draws all 60 from that same
outline. `_build/clean_map.py` traces the silhouette out of her artwork and
`app.js` carries it as a path in its own 439×624 space, so each bulb can be
filled in any colour and stays crisp at any zoom. The sample images themselves
are stripped from the raster, or they would double up.

The palette is sampled from her artwork. The seven she coloured by hand keep
those colours; the rest cycle the palette. See `BULB_PALETTE` and `BULB_SET`
in `_build/build_data.py`.

**Each bulb leans with the route**, so the pathway reads as the cord and the
bulbs as lights clipped along it. `bulb_tilt` finds the route by its grey
(`#a2a2a2`) in a render of the page, takes the principal axis of the route
near each bulb, and sets the bulb perpendicular to it. Pointing each cap at
the *nearest* bit of route instead was the obvious approach and the wrong one
— it turns every bulb on the far side of the loop upside down. The lean is
capped at 48° so a steep stretch doesn't lay a bulb on its side.

Bulbs are drawn at 21 points tall, matching the size on page 2. Larger starts
swallowing the business names on the denser stretches of the route.

The text is drawn rather than baked in because a flat export turns to mush the
moment anyone zooms. Being vector, it stays sharp all the way to 6×. The
artwork underneath does soften when you zoom right in, but blurry shapes read
far better than blurry words.

Everything comes out of one read of the PDF, so the lettering and the markers
cannot drift apart.

### The typeface

Everything on the page — the map's lettering, the list, the cards, the
credit — is set in **Proxima Nova**, Regular and Bold. The files are
Ketaki's own (from her fonts folder in Dropbox, `SF Ballet/SFB_Assets/
SFB_Fonts/Proxima-Nova`), subset to Latin with `pyftsubset` and served from
`assets/fonts`; `--font` in `style.css` is the one stack every rule uses.
Whether that desktop licence covers web embedding is hers to check.

The map's lettering was placed for Glacial Indifference, the face Canva set it
in, and at the same point size Proxima runs about 6% wider — enough to push
the tightest names into their neighbours. `LABEL_SCALE` in `build_data.py`
sets every label at 0.945 of its Canva size, which gives back the widths the
layout was placed for; Proxima's larger x-height means it reads the same size.

`glacial-indifference-subset.woff2` stays as the fallback while the Proxima
files load: it was subset straight out of the Canva PDF (Glacial Indifference
is SIL OFL licensed, which permits this), so a page caught mid-load still
shows the map's own lettering rather than a system face.

Two labels are set in KompotDisplayOutline, a Canva display font we have no
licence to ship as a webfont, so `clean_map.py` leaves them in the artwork to
be traced rather than lose them. Traced, a five-point outlined font wobbles.

**"TO DOWNTOWN ELKADER" is typed out instead.** `TYPED_OUT` in
`optimise_svg.py` lifts the traced glyphs back out of the SVG — matched by
bounding box, so the arrow above them, which is a drawing rather than
lettering, stays — and `TYPED_LABELS` in `build_data.py` puts the three lines
back as live text in the map's own typeface, on the baselines the glyphs sat
on. Both ends fail loudly: if the artwork moves and `TYPED_OUT` finds no
glyphs, the build stops rather than shipping the words twice over.

The height `TYPED_OUT` measures is of the control points, not of the ink — a
curve's handles reach past the curve — so a five-unit letter measures eight.
That is why its `max_h` is 14 and not 8.

The decorative "E L K A D E R" across the top is still traced. It is the same
font and the same wobble; typing it out means choosing a different face, which
is Ketaki's call.

## Fitting a fixed-height box

The page fills whatever height it is given and never grows the document. That
matters because it is embedded in a fixed-height iframe on the GoDaddy site,
which clips anything taller than the height set there.

**The map opens at 80% of the height, on every screen, and cannot be zoomed
out past it.** `minScale()` is `stage.clientHeight / cropPx().h * OPEN`, with
`OPEN = 0.8`, and it is both the opening view and the floor `setScale()` clamps
to — so the height is still the one thing that never changes, whatever screen
the page is on: the map is always the same fraction of its box.

It filled the height exactly until 28 Oct 2026, when Ketaki asked for the map
20% smaller. The fifth that frees up shows as white above and below the map;
that is the price of the smaller map, and her call. If the embed's box on the
GoDaddy site ends up the wrong height for it, `OPEN` is the one number to
change.

Wherever filling the height leaves the map wider than the box — a phone, or a
short frame — it runs off the sides and you pan across it. Shrinking the whole
map down to a narrow screen makes sixty business names unreadable, and reading
them is what the page is for.

The button bottom right returns to that same view. There is no "fit the whole
map" any more; it would have had to break the floor to do it.

## Sponsor credit

Bottom right of the map, to the left of the zoom buttons, linked to
<https://www.studiok8ki.com/>. Set the way Ketaki set it in Canva — four
centred lines on a white card:

```
   Interactive Map
Designed & Sponsored by
       [ K8Ki ]
    DESIGN STUDIO
```

Both are children of `.corner`, a flex row that stands clear of the open list
(`--list-w`), so the credit sits in the white band beside the map on a wide
screen and over the map's empty bottom-right corner on a narrow one.

Its size is its height. It stood as tall as the zoom column (134px) until
28 Oct 2026, when Ketaki asked for it 25% smaller: `.credit` is 100px tall
now, bottom-aligned with the fit button, with the type and the wordmark at
three quarters of their old sizes (11px, 16px, a 159px wordmark).

It used to be printed on the map itself. Ketaki set it in Canva, inside the
loop, and the page drew every part of it there — the three lines as live text,
the wordmark from the brand kit, an invisible link over the lot — and moved
the block to where the list did not cover it. Out in the chrome it never
crowds a display, stays sharp and clickable at every zoom, and stays put when
the map is panned. `build_data.py` still finds her block on the artwork, by the
K8Ki wordmark image (521×144) in the PDF, and takes its three lines of
lettering off the map (`drop_credit`); the wordmark was never in the artwork,
since `clean_map.py` strips it.

## Older note on the sponsor credit

Bottom right, linked to <https://www.studiok8ki.com/>, in the empty corner of
the artwork. Four centred lines:

```
Interactive Map
sponsored by
   [ K8Ki ]
DESIGN STUDIO
```

The zoom buttons sit above it. Both are children of `.corner`, a flex column,
so the credit can change height without anyone having to recompute an offset.

The credit lives in the page chrome rather than on the artwork, so it stays
sharp and clickable at every zoom level and does not scroll away when the map
is panned. It scales down below 430px wide but keeps all four lines.

## The participant logos

`assets/logos/` is built from the project's **`../Logos/`** folder by
`_build/extract_logos.py`. That folder is the only source — Ketaki drops in a
file named after the business and re-running picks it up. The same run also
writes `assets/show-logo.webp` from `Holiday Light Show 2026.png`; see
[the show logo](#the-show-logo).

```bash
python3 ../_build/extract_logos.py ../Logos assets/logos
```

File names are matched forgivingly: exact first, then closest by spelling. The
folder has "Midwest Lifestock", "Meuser Lumber" and "Drone xpert" against the
map's "Midwest Livestock", "Meuser's Lumber" and "Drone Xperts", and chasing
each with its own alias is a losing game. A match has to be both close *and*
clearly ahead of the runner-up, so a genuinely unknown file is reported rather
than attached to whatever it resembled. `FILE_ALIASES` covers what spelling
alone can't — "RCTA", "TnT Powersports", "AitP logo".

Two deliberate exceptions. `KEPT` is for logos already in `assets/logos/` that
no file may overwrite, which is how K8Ki's saffron mark from the brand kit
stays put. `NO_LOGO` is for spots that must not show one at all.

Logos are named after the **business**, not the file they came from, so the
same logo keeps one name however it is spelled in the folder. Anything in
`assets/logos/` that nothing points at is deleted on each run — so taking a
file out of `Logos/` takes it off the map.

They are saved as WebP, about a third the size of PNG with the transparency
intact, and a card loads only its own, so nobody downloads every logo for a
map they never tap.

### The white background comes off

Most of these arrive as JPEGs on white. `drop_white_background` makes that
white transparent so the mark sits on the card rather than in a box.

It only removes white **reachable from the edge of the image**. The white
inside an "O", or a white word on a dark block, is never connected to the
border, so it stays — a plain threshold would punch holes through half of
them. Near-white is faded rather than cut, because JPEG leaves a haze around
the artwork that a hard cutoff turns into a grey fringe.

Logos with a background of their own — Masonic Lodge's black, Erickson's
black, The Collective's, Bethany's grey — keep it. Their border isn't white,
so nothing is removed.

It runs after the resize, on an image of at most 420px. On the full-size
originals it would be walking millions of pixels.

Each run prints the businesses with no logo in the folder. That list is the
to-do, not an error.

## The display list panel

Three parts, and only the last one scrolls:

* **the show's own logo**, centred
* the display count under it
* the search box
* the list

`.panel` is a flex column. The top and the head are `flex: none` and the list
is `flex: 1; min-height: 0` — without that `min-height` a flex item refuses to
go below its content height, and the list would push everything else out of
the panel.

On a wide screen there is no sponsor credit at the foot. It stands beside the
zoom buttons, and a second copy in the panel was the same credit twice on one
screen. On a phone there is one here after all, small, because the corner of
the map that carries it is not on view — see *On a phone*, below.

The show logo is centred, and the close button is taken out of the flow and
pinned to the corner to let it be: left in the flow it would centre the logo
against the space left over beside it rather than against the panel. On a
short screen (`max-height: 460px`) the logo and the wordmark give up their
height rather than squeezing the list out.

### The show logo

`assets/show-logo.webp` is built from `../Logos/Holiday Light Show 2026.png`
by the same `extract_logos.py` run that does the participant logos, through
the same trim and white-knockout. It is not a participant, so it is written
beside the map rather than into `assets/logos/`, and it never appears in
`logos.json`.

### The list is open to begin with, and the card opens inside it

**The list is always open and nothing closes it.** No close button, no
Displays toggle in the header, no click on the map, and Escape closes the card
rather than the list. `togglePanel()` only ever opens; it stays a function
because the map has to be re-framed around the list once it is in place.
Picking a name opens the detail **at the foot of the list**, not floating over
the map, so a closed list would have nowhere to put it — picking a bulb out on
the map opens the list to show you the card.

`.card` is the last flex child of `.panel`, `flex: none` so it keeps its
height and the list above gives way, capped at `max-height: 52%` so a tall
card cannot squeeze the names out altogether.

The bulbs stand at the very top edge of the card — the card has no top
padding — and they are large, because they **are** the spot number here.
There is no line of wording under the name repeating it: "Spots 51 & 52"
under two bulbs marked 51 and 52 only said it twice. The card carries an
`aria-label` saying it in words instead, since the bulbs are pictures as far
as a screen reader is concerned.

The logo spans the full width of the card below them, `object-fit: contain`
so a wide wordmark fills the width and a tall round one centres in the box.
These arrive as tall circles, wide wordmarks and the odd photograph, and
anything that crops or distorts them looks careless with someone else's
brand.

All of that is the wide screen. Narrower than 660px the page changes shape —
the list goes behind a DISPLAYS button and the card becomes a sheet over the
map; see *On a phone*, below. (Until 28 Oct 2026 the list simply covered the
map on a phone, with no way to put it aside.)

The list is an overlay, so the stage underneath it is still full width. Left
alone the map would centre *under* the list and lose its right-hand side
behind it. `listInset()` reports how much of the stage the open list covers,
and `measure()`, `constrain()` and `focusSpot()` all work off the width it
leaves, so the map is framed beside the list rather than behind it. Opening or
closing the list re-frames the map — unless it has been panned by hand, in
which case that is the reader's view and not ours to take back.

`remeasureList()` also publishes that width to the CSS as `--list-w` on
`.hls`, and the two things that sit on the map rather than in the chrome use
it: the zoom buttons stand to the **left** of the open list instead of hiding
behind it, and the "tap a bulb" hint centres on the map rather than on the
window. Both slide back to the window's edge when the list is closed. On a
phone it is 0, because the list covers the map entirely and there is no strip
of map left to stand them on.

The inset is measured when the list opens, closes or the window changes, never
on every read: `constrain()` runs on each frame of a drag, and asking an
element for its width makes the browser lay the page out again before it
answers.

## On a phone

Below 660px — the width at which `remeasureList()` stops crediting the list a
width beside the map — the page is the layout Ketaki chose on the canvas on
28 Oct 2026 (row F there): the bar from the Art in the Park site, the
full-screen list, the bottom-sheet card.

* **A bar across the foot, MAP and DISPLAYS.** `.tabs`, 60px (`--tab-h`), the
  active one navy. The DISPLAYS icon is the map's own bulb, drawn in by
  `drawTabBulb()` from `bulbArt` as a silhouette in the button's colour. The
  stage stops at the bar (`.stage { bottom: var(--tab-h) }`), so the opening
  view and the zoom floor are worked out in the room above it.
* **The list fills the screen behind DISPLAYS.** The same `.panel`, stretched
  to the full width and sliding in from the right as it always did; MAP slides
  it away, and so does picking a name. The show logo is 124px here, the bulbs
  in the rows hang from the top of the row by their caps, and the sponsor
  credit is pinned small at the foot (`.credit-foot`, 70% of the drawer size
  in the mock) — the one in the corner of the map is put away.
* **The card is a sheet over the map.** Square-cornered, sitting on the bar,
  the map still showing above it. It cannot live inside the list for this, so
  `placeCard()` moves the `.card` element out to be a child of `.hls` on a
  phone and back into the panel on a wide screen; the stylesheet places it
  from there (`.hls > .card`). A handle at the top pulls it down to just the
  name (`.peek`, 100px) and up again. The logo box is a fixed 150px on the
  sheet so its height is known the instant it opens.
* **Picking brings the bulb into view.** `sheetInset()` reads the open
  sheet's height and publishes it as `--sheet-h`; `constrain()` and
  `focusSpot()` take it off the stage height, so the bulb is framed in the
  window above the sheet rather than under it, and the zoom buttons ride up
  over it. On a phone a bulb tapped on the map is brought up too, since the
  sheet is about to rise over where it was. It glows the same way it does on
  a wide screen — the same `.is-on` halo.
* **Previous and Next say where they go**, on every width: "← Spot 4" over
  "Elkader Child Care Center", the name held to one line. `nameNav()` fills
  them in from the neighbouring rows.

Nothing above 660px changed for this. Crossing the line either way (turning
a tablet, say) re-homes the card and re-frames the map.

## The card

Number, logo and wording sit in one row rather than stacked — the card is wide
enough for it, and stacking pushed the business's name below the fold on a
phone. The row closes up on its own for the businesses with no logo. On narrow
screens the logo is held smaller so a long name wraps over two lines instead
of three.

The card is white, and so is the Displays panel — like the map they sit over,
with a shadow and a hairline doing the separating rather than a block of
colour.

Cards were tried in their bulb's colour, first as a tint and then at full
strength, and dropped. Worth knowing why before trying it again: the seven
bulb colours split into five light ones and two browns, and the browns carry
neither dark text nor white at the 4.5:1 that body text needs. Making them
work meant deepening those two, flipping every piece of ink on the card, and
putting a white plate behind the logo so a black wordmark did not vanish —
a lot of machinery for a card that reads better plain.

The card's ink is named in one place (`--ink`, `--ink-soft`, `--ink-chip`,
`--ink-edge`) so the heading, the sub line, the link buttons and the nav stay
in step.

## Links on the card

Website, Facebook and Instagram, read off the participants spreadsheet by
`_build/read_links.py`. The sheet keeps them all in one Website column —
sometimes several in a cell, separated by commas or just spaces — so they are
sorted by what the URL points at rather than which column they sat in.

Only the participant name and those links are taken. That sheet also carries
contact names, phone numbers, emails and payment records, none of which may
reach a published page.

Spreadsheet names don't always match the map's, so `ALIASES` covers the ones
that differ by more than punctuation. Anything unmatched is printed rather
than silently dropped.

Each kind holds a **list**, not one URL. Art in the Park gave two websites in
the one cell and Ridgeview two Facebook pages; both are theirs, and both are
shown. Where a kind has two, the card tells them apart by host — "Website
(artintheparkelkader.com)" — or, when the host is the same for both, by
number: "Facebook 1 of 2". `fillLinks()` still accepts a bare string, so an
older `data.js` does not come up blank.

### A link that arrives in a message

Some come by message rather than through the sheet. Those go in `HAND_LINKS`
in `read_links.py`, keyed by the name used in `SPOTS`, and are merged over
whatever the sheet had — per kind, so a hand-given Facebook page sits beside
a website the sheet already carried. A name that is not in `SPOTS` fails the
build rather than being quietly dropped.

Put them there rather than in the spreadsheet: editing the sheet would mean
writing to a file full of contact details and payment records in order to
publish one URL.

```bash
python3 ../_build/read_links.py ../_build/sources/participants.xlsx
```

They show as icons, not addresses: most are
`facebook.com/profile.php?id=615535759369`, which tells a reader nothing and
wraps over three lines.

## Re-setting a stacked label

The artwork stacks long names over several lines, as separate text spans.
`RESTACK` in `build_data.py` replaces a whole stack at once and centres the
replacement on the block, so a three-line name can become one line — or the
other way round — without the label drifting up or down the map. "Scoop / -A-
/ Bowl" became "Scoop-abowl" that way, and "Whoopsie / Daisy" gained a
"Greenhouse".

It matches on the wording *and* on the spans genuinely sitting above one
another in the same column: the same word turns up elsewhere on the map, and
only the stack is the label. A rule that matches nothing stops the build.

## Withholding a logo

`NO_LOGO` in `extract_logos.py` — spots that must not show one whatever turns
up for them in either source. St Joseph Catholic Church asked for theirs off.

## Swapping printed numbers

`SWAP_NUMBERS` in `build_data.py` exchanges two numerals on the artwork's own
text spans, so the marker and the label move together and stay on the same
bulb as each other. 12 and 13 are swapped there.

## Participants who pull out

`WITHDRAWN` in `build_data.py`. The spot stays on the map — its bulb and its
number are real, and the numbering runs through them — but the business name
comes off, along with the marker, since there is no business left to open a
card about.

It lists the exact wording on purpose: if the Canva text changes, the build
stops rather than quietly leaving a withdrawn business on a published map.

## Changing the displays

`data.js` is generated — don't edit it by hand, it gets overwritten. Edit the
`SPOTS` table in `../_build/build_data.py` and regenerate:

```bash
python3 ../_build/build_data.py ../_build/sources/map-canva-p2.pdf data.js
```

Spot numbers and positions come from the Canva map; business names come from
the 2026 participant spreadsheet. Where the two disagreed the map won — see
`../NOTES-map-data.md`, which lists conflicts still worth fixing in the
spreadsheet.

## If the Canva map changes

Export **page 2** as PDF at pro quality to
`../_build/sources/map-canva-p2.pdf`, then run both scripts:

```bash
python3 ../_build/clean_map.py  ../_build/sources/map-canva-p2.pdf ../_build/preview
python3 ../_build/vectorise.py  ../_build/sources/map-clean.pdf    assets/map.svg
python3 ../_build/build_data.py ../_build/sources/map-canva-p2.pdf data.js
python3 ../_build/stamp.py      .                                  v18
```

Run them in that order: `clean_map.py` writes the cleaned PDF the other two
read. It also writes a PNG of the map into `../_build/preview` — that is a
reference render to eyeball, not something the page ships.

`vectorise.py` needs VectorCraft installed; it starts and quits the app
itself. Everything except `stamp.py` needs `pymupdf`.

`stamp.py` goes last, and the version you pass it is whatever you want to see
on screen — bump it each time you publish a preview, so there is never any
doubt which build is being looked at.

## The build stamp

Bottom left of the page, in small type: the version and the date it was built.

It is there because this page caches hard, and a stale copy is pixel-identical
to a fresh one — an afternoon went into chasing "blurry edges" that turned out
to be a browser quietly serving the previous build. If the stamp does not say
what you expect, you are looking at an old copy, and that is worth knowing
before reporting anything else.

`stamp.py` also re-keys every `?v=` in `index.html` to a hash of what the
assets actually contain. That is the part that stops the stale copy being
served at all; the stamp is so a person can confirm it.

**The stamp is for previews only and never shows on the live site.** `app.js`
hides it on any host listed in `LIVE_HOSTS` — add the GoDaddy domain there
when the map goes live. The GitHub Pages copy is a preview, so it shows the
stamp on purpose: it says which build a client was looking at.

That list is a denylist rather than a list of preview hosts, deliberately. An
allowlist fails silently the wrong way: get a preview host wrong and the stamp
quietly never appears, which defeats the only reason it exists. A denylist
fails the harmless way — a stamp somewhere it wasn't wanted, which you can see
and fix in a second.

`clean_map.py` strips the lettering, the Holiday Light Show logo, the QR code,
the printed web and Instagram addresses, the internal planning notes, and the
live hyperlink to the reservations Google Sheet. **Do not skip it** — the raw
export is not safe to publish, and that link leads to contact names, emails and
payment records.

`build_data.py` re-reads the same PDF for the positions and refuses to write a
file if any internal text would have reached the page. It needs `pymupdf`.

## Still loose

The yellow dots on the artwork used to mean "potential spot for a display".
Their legend was an internal note and is gone, so the dots now have nothing
explaining them — either give them a meaning or remove them in Canva.
