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

## On the GoDaddy site

The City's page does not host the map; it frames it from GitHub Pages. In
the GoDaddy editor, an HTML section ("Try out our NEW interactive map!")
carries the frame and, since 13 Nov 2026, a short script that makes it full
width. Its Custom Code, exactly as published, is kept in
`../godaddy-embed-snippet.html`; the frame part of it is:

```html
<iframe src="https://kpoyekar.github.io/elkader-holiday-light-show-map/"
        title="Elkader Holiday Light Show map of the displays"
        style="display:block; width:100%; height:720px; border:0"
        loading="lazy" allow="fullscreen"></iframe>
```

The map fills whatever height the frame gives it (see *Fitting a fixed-height
box*). The frame says 720px, and since 13 Nov 2026 the script after it makes
it as tall as the window on a computer (720px at least), setting both the map
frame and GoDaddy's own frame around it; GoDaddy animates that over 1.5s. On
a phone (under 660px wide) it stays 720px: the map takes the swipes, so a map
as tall as the screen would leave nothing to scroll the page by. (An earlier
note here had 80vh with a 600px floor; what was on the site on 13 Nov 2026
was a plain 720px.) The section's Forced Height is blank.

Full width (asked for on 13 Nov 2026): GoDaddy holds an HTML section to the
page's text column and has no setting to let it out. But it runs the
section's code in a frame of its own on the City's own domain, so a script
in that code can reach the frame and stretch it to both edges of the window,
and again on every resize. Tried on the live page before it went in (edge to
edge at 375, 1125 and 1440 wide, no sideways scroll, follows a resize), then
published from the GoDaddy editor on 13 Nov 2026 and checked on the live
page at 1440 wide. The window-height part went in the same day: checked live
in a 1728x941 window, where the map came out 1728x941. GoDaddy reloads the
section's frame once after the page loads, which is harmless here, since the
script is part of the section and runs again.

The section is navy too, since 13 Nov 2026, to go with the navy map: the
same script sets its background to #0d2a44, the heading to #eef3f8 and the
short rule under the heading to a faint light line. GoDaddy's own section
background setting only offers the theme's colours, and navy is not one of
them; changing the theme would recolour the whole site. If GoDaddy ever stops running scripts in HTML sections the
map simply goes back to the column width. It sits above the "Reserve your spot today!" section,
since 28 Oct 2026. Pushing to GitHub updates the embedded map on its own; the
GoDaddy page itself never needs touching again for a new build.

Only the buttons zoom on a computer (v113, 13 Nov 2026). Once the map stood
a whole screen tall in the City's page, a mouse wheel that zoomed it caught
everyone scrolling down the page. So the wheel now scrolls the page past the
map, and a double-click no longer zooms; the + and - buttons (and the + and
- keys) do. A trackpad pinch is stopped outright, so it zooms neither the map
nor the whole page. Letting the scroll out takes `overscroll-behavior-y:
auto` on the map's own page at computer widths in style.css: with `none`, as
before, a scroll that reached the map stopped there. Phones are as they were:
pinch and double tap zoom, and nothing scrolls out of the map. Tried in a
page nested the way GoDaddy nests it: a real wheel over the map scrolled the
page 300px and left the zoom alone.

## What to upload

Everything in this folder, if the map is ever served from the City's own
hosting instead of GitHub Pages. Nothing outside it is needed at runtime.

```
index.html      the page
style.css       all styling (the light map's sheet)
navy.css        the navy look, over style.css (since 13 Nov 2026)
navy.js         keeps the bulb numbers navy on the glass
app.js          pan, zoom, markers, search, text layer
data.js         the 68 display spots and all 216 labels — GENERATED, see below
assets/
  map.svg       the artwork — vector throughout, no lettering, no raster;
                recoloured navy by _build/navy.py
  k8ki-logo.svg sponsor wordmark (the brand yellow #ebb248, from the rebrand logo kit)
  show-logo.webp  the show's own logo, at the top of the list, reversed
                  for the navy ground — GENERATED (copied from _build/navy/)
  logos/        53 participant logos, shown on the detail card — GENERATED
                (59 of the 66 named spots show one)
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

## Google Analytics

Added 13 Nov 2026 (v112). `analytics.js` loads Google Analytics into the map
page: property "Holiday Light Show Map" in the Main Street Elkader account,
measurement ID `G-Y063ZQXBYL`. Because the GoDaddy site shows this page in an
iframe, every view there is counted here, in Ketaki's property; the City's own
analytics are not involved.

It keeps out of `app.js` entirely: it listens for clicks and reads the card
after `app.js` has filled it in. Events: `bulb_tap`, `list_pick`,
`display_view` (any card opened), `sponsor_link`, `map_search`,
`events_open`, plus the usual `page_view` with `embedded` yes/no. Display
events carry `display_name` and `display_number`. If the card's ids
(`card`, `cardName`, `cardN`, `markers`, `list`, `q`) are ever renamed,
change them in `analytics.js` too.

Since v113 it sends nothing from `localhost` or the claude.ai preview
(`*.claudeusercontent.com`), so trying a build out is not counted as a
visit. The GitHub Pages address and the City's page both still count.

The K8Ki website link on spot 14's card carries UTM tags
(`utm_source=holiday-light-show-map&utm_medium=referral&utm_campaign=design-credit`),
so Ketaki's own analytics can tell visits that came from the map. They were
put straight into `data.js` on 13 Nov 2026 (commit a0029f5) and now come
from `HAND_LINKS` in `read_links.py`, which is not put through the cleaner
that strips UTM tags from every other link, so a rebuild keeps them (checked:
a full rebuild gives the same `data.js`, byte for byte).

## Source

Everything is built from **page 2** of the Canva file "Holiday Light Show MAP
2026" — the revised version, with full business names, paired spots merged into
one label, and no QR code, logo or internal notes. Page 1 is the older layout
and is not used.

## How it's put together

### On a navy ground (13 Nov 2026)

The map is dark blue since v114. Ketaki saw a mock on 3 Nov ("where the
background is dark blue and make other elements have contrast"), held it on
6 Nov, had it rebuilt on the current map on 13 Nov and then said "make the
navy version live". It is three layers over the light map, each of which can
come off again:

* `navy.css`, after `style.css`: the page ground #0d2a44, the list panel a
  step darker (#091f33), cards and the events page #12375a, light lettering,
  gold (#f3c05b) for the active tab, the Book and Facebook buttons and the
  month on the event tiles, a light plate behind sponsor logos (most are dark
  lettering made for white), and the credit's card in the map corner in the
  card navy rather than white. The bulb numbers and the hall's three lines
  stay navy, on the bulbs' glass and the hall's light blue roof.
* `navy.js`, after `app.js`: marks the bulb numbers (`text.num`), which are
  plain text in the lettering layer like the names, so `navy.css` can keep
  them dark.
* the artwork, recoloured in place by `_build/navy.py` (buildings and High
  Street #1b4163, the road #5d7b97 so the candy dashes still read, the line
  art pale #d6e0ea, the ground navy, a white card behind the EXIT sign's
  cut-out letters). Run it again after any rebuild of `map.svg`; it marks
  the file and refuses to run twice.
* the show logo, reversed (navy lettering to white): `extract_logos.py`
  copies `_build/navy/show-logo-navy.webp` in, so a logo rebuild keeps it.

`style.css` still describes the light map throughout; read its colours as
what `navy.css` turns. To go back: drop the two lines from `index.html`,
rebuild `map.svg` without `navy.py`, and let `extract_logos.py` save the
plain show logo again.

### The 11 Nov 2026 changes (page only)

The committee asked for a round of changes on 11 Nov 2026, and Ketaki had
them made on the page without touching Canva ("i havent made these changes
on canva. can you just do it here?"). So the Canva file still has the 7 Nov
layout, and the page moves things off it:

* Senior Life Solutions goes in between K8Ki (14) and Fidelity Bank, on the
  curve, so it is spot 15 and Fidelity Bank to Alliant Energy are each one
  higher than the artwork prints them (Fidelity 16, EXIT 17, ... Alliant
  42). 43 on keep their numbers. Fidelity Bank and EXIT Realty step along
  the road to make room, and K8Ki's name steps right, off the new bulb.
* thINK Custom and Elkader Care Center swap places: thINK is 24 now,
  Elkader Care Center 25.
* Whoopsie Daisy (43) to Erickson Underground (48) are spread further apart
  down the right-hand road, into the room Senior Life left: 29.5 apart where
  they were 21, Erickson staying put.
* At the entrance, the welcome shed and the KCTN mailbox go up the road to
  where the arches stood, and the arches, bulb 1 and Schlee & Sommers' name
  go down to where the mailbox stood. Bulb 1 stands just past the arches;
  its name goes under the road, since Foundations Wealth Partners' name
  fills the space above.
* "Rapid & YellowIron" reads "Rapid Innovation & YellowIron" and "CJ Moyna,
  ELC, MTS" reads "CJ Moyna, Earthmoving Legacy Center, MTS", both on three
  lines growing upward off their bulbs. Pattison loses the "Sand", on the
  map and on the card ("Pattison Company").
* Floral Hall reads SPECIAL EVENTS / AT / **FLORAL HALL** on three lines,
  the hall's name in bold (app.js, where the hall's lettering is drawn).

How it is done: `RENUMBER` and `LAYOUT` in `../_build/build_data.py` renumber
and move the bulbs, numerals and names read off the artwork, through
`layout()`, which `colour_spread.py` reads through too. The drawing (arches,
shed, mailbox) is moved in `assets/map.svg` itself by
`../_build/move_entrance.py`, run once; it marks the file and refuses to run
again. The renames are `RESTACK` rules. Bulb colours were worked out again
for the new numbers and places (see "Bulb colours"); links and logos were
regenerated, and match what they were, under the new numbers.

If the Canva file is ever brought into line with these, the rules come out:
`RENUMBER` and `LAYOUT` emptied, and `move_entrance.py` not run on the new
trace.

### The 1-70 lineup (7 Nov 2026)

Ketaki rearranged page 2 again on 6-7 Nov 2026: 1-14 kept their numbers, the
rest were renumbered, and there are 70 spots now, every one taken. New
businesses: Senior Life Solutions (42), Casey's (57) and Rapid Innovation &
Yellow Iron (65 and 66); Pattison Sand Company moved to the top road (62 and
63); CJ Moyna's pair (68 and 69) now names Mobile Track Solutions and the
Earthmoving Legacy Center too; Fidelity Bank is 15 and EXIT 16 and 70, both
labelled "EXIT Realty" on the artwork now. The Collective and Art in the Park
swapped names (12 and 13). 53 and 54 are no longer for sale, so nothing on
the map says AVAILABLE.

The artwork itself did not change -- only lettering and bulbs -- so
`assets/map.svg` stands. The new numbers follow the drive the candy dashes
already take, so `route_tour.py` stands too.

Corrected on the page, and worth fixing in Canva:

* two bulbs read 44 and 41 is missing: Alliant Energy, in the middle of the
  loop, kept its old 44 (`NUMBER_FIXES`)
* two bulbs read 65 and 66 is missing: the left of Rapid & YellowIron's pair
  is 66 (`NUMBER_FIXES`)
* 58, Drone Xperts, has its number and name but lost its bulb; the page puts
  back the one that stood there on the 6 Nov export (`ADD_BULBS`)
* "4H/County Countil" reads "4H County Council" (`TEXT_FIXES`)

Bulb colours were worked out again (see "Bulb colours"). The right-hand
road now carries bulbs where it runs beside the outer one, and at 50 apart
four colours no longer go round; the rule is 47 now.

Logos for Senior Life Solutions (the yard-sign graphic Ashley made for them,
shown as sent), Casey's and Elkader Pack 62 & Troop 62 came from Ashley
Augustyn on 6 Nov. Links come from the committee's live participants sheet
now: its Participant and Website columns only, copied to
`_build/sources/participant-websites.csv` (see "Links on the card").

v103, the same day, after Ketaki looked at v102:

* colours: only K8Ki gold, EXIT blue and Pattison grey are hers now; the
  rest were spread as far apart as they go, and spot n and n+1 never match
  (Fidelity Bank, beside K8Ki, is no longer gold)
* the Facebook and Instagram links the live sheet's single column had lost
  came back from the October sheet
* Rapid Innovation & Yellow Iron link to yellowironequip.com and Rapid
  Innovation's Facebook page; cjmoyna.com is back on the CJ Moyna pair
* K8Ki's card photo is cropped to 2:1 and fills the card's width

### The 1-67 lineup (6 Nov 2026)

Ketaki rearranged the map in Canva on 5-6 Nov 2026: new numbering, eight more
spots (68 in all; 68 is EXIT Driftless Group's second, on the road by the
EXIT sign), and new businesses -- Fidelity Bank (17), Clayton Drug
(45), Bennington Construction (46), Elkader Pack 62 & Troop 62 (47), Outdoor
Creations (51), River Sound Co-op (52) and the Elkader Police Department
(65). Schlee & Sommers, who light the entrance arches, are spot 1 now rather
than an extra beside the numbered spots. Julie Doeppke - American Family
Insurance and Ethan Koehn Construction are gone. 53 and 54 are for sale.

The base artwork did not change -- the same image of roads and buildings in
both exports -- so `assets/map.svg` was not re-traced. Three pieces of it
moved, and are shifted by exactly what Canva moved them (`MOVES` in
`optimise_svg.py`): the ELKADER lettering, out to the right of the loop, and
the welcome shed and the KCTN mailbox, by a few units. The view's crop box
(`CROP` in app.js) runs out to x 724 so ELKADER is inside it.

One number is printed wrong on the artwork and corrected by position
(`NUMBER_FIXES` in `build_data.py`): two bulbs read 41 and 42 is missing; the
lower of Alpine's two bulbs sits between 41 and 43, so its "41" is 42. The
printed map wants the same fix in Canva. (Wilke's read 30 the same way, for
20; Ketaki fixed that one in Canva.)

The same day Canva gained the Central CSD Photo Op beside Floral Hall -- a
camera icon, lifted from the PDF as vector into `map.svg` by `ICONS` in
`optimise_svg.py` (shapes in `_build/camera.json`), with its two lines of
lettering coming through as ordinary labels -- and a second HOLIDAY LIGHT SHOW
BANNER label under the trail counter (the first, by the ELKADER sign, is
still on the artwork too). The red bulbs take Canva's red, `#bd7055`, in place
of the October export's `#ac6455`.

Ketaki sent logos for Clayton Drug, Bennington Construction, the Elkader
Police Department and River Sound Co-op the same day; Fidelity Bank, Elkader
Pack 62 & Troop 62 and Outdoor Creations have none yet. None of the new
businesses is in the October participant sheet, so none has links yet.


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

`UNNAMED` in `build_data.py` holds the spots with no participant: 53 and 54
since the 6 Nov 2026 lineup (56 and 60 before it). The bulb, the number and the
marker all stay: the display is there and its number is printed on it.

On the map they say **AVAILABLE**. A spot that lost a business name takes the
word where the name sat (`build_data.py` keeps the slot as it drops the name);
53 and 54 never had one on the artwork, so `FREE_TAGS` places it by hand.
The two bulbs stand closer together than one AVAILABLE is wide, so the words
step down one under the other: 53's first, as far left as River Sound Co-op's
name allows, then 54's, centred under its own bulb.

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

### Nine participants have two spots

Peace Church has 6 and 7, EXIT Driftless Group 17 and 70, Alpine
Communications 27 and 28, MercyOne 29 and 30, Brown's 33 and 34, St Joseph 59
and 60, Pattison Company 62 and 63, Rapid Innovation & Yellow Iron 65 and
66, CJ Moyna 68 and 69 (the 7 Nov 2026 lineup as renumbered on 11 Nov: most
names sit between their two numbers on the artwork; EXIT's two are far
apart, one inside the loop and one by the EXIT sign). The two markers have
different ids, so nothing in the data ties them together except the name —
which is what `groupSpots()` in `app.js` groups them by.

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

### One number on the page: 70 displays

The search box says it: **Search 70 displays by name or number**, or just
"Search 70 displays" where the box is too narrow for the rest (`fitPlaceholder()`
in app.js measures it, leaving room for the box's clear button). The count is
every spot with a business on it, so a business with two spots counts twice,
and a spot still for sale is not counted, since there is no display there yet
(there are none since the 7 Nov 2026 lineup; it read 66 while 53 and 54 were
for sale). Until 8 Nov 2026 (v108) it was a line of its own under the show
logo, "70 displays"; Ketaki asked for it in the search box instead. The line
is still there for a screen reader (`#count`, hidden on screen), which hears
how many a search matches, "4 of 70 displays".

Until 6 Nov 2026 it counted participants instead -- a business with two spots
once -- and read 50, then 58 for the new lineup; Ketaki asked for it to count
the displays. (It stood in the top-left header too, until the header went on
28 Oct 2026: the page sits in a section of the GoDaddy site that carries its
own heading.) The map carries 68 numbered bulbs in all.

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

### The way the cars go: candy dashes

Red and white dashes slide along the road in the direction of travel: the
"candy dashes" Ketaki chose on 30 Oct 2026 from a page of mock-ups (seven
treatments, none of them an arrow, which she dislikes). No arrow is left on
the map: the artwork's twenty-two chevron clusters and the curved arrow in
the fork by 44 all come off in `optimise_svg.py` (every `CHEVRON_FILL` path).

The route the dashes follow is one continuous drive, `route.tour` in
`data.js`. `_build/route_tour.py` takes the stretches `route_path.py` derives
from the road ribbon (`routepath.json`: cut at every junction and pointed the
way the artwork's chevrons pointed), puts them in the order the spots are
numbered, and bridges each gap with a path through the middle of the road
(Dijkstra over the road mask, straight when under 16 units). Two things in
its `ORDER` list are hand-made. The first pass up the right-hand road turns
off at the fork by 44 for 12 and 13 (Ketaki: "from 10, 44, 12, 13 that way
and then up and out"): that fork is a hairpin, the branch leaving the trunk
going back down-left, so the drive runs up the trunk to (489,300), through
the middle of the merged ribbon at (485,295) and down into the branch, which
keeps the marks on the grey road through the turn. And the second pass, from
43, goes north at 45 and out. The loop round the parking area is a branch
(`route.branches`). The short piece of trunk between the fork and the
junction at 45 is left unmarked, since no car drives it. `ORDER` indexes
`routepath.json`, so look at it again whenever that file is regenerated.
`route_tour.py` writes `_build/tour.json`, which `build_data.py` carries into
`data.js`.

Two signs stand on the road in the artwork, the EXIT sign over the junction
by the exit and the PARKING AREA sign on the parking road. The road runs under
them and so do the dashes: `route_tour.py` finds each by its fill (`SIGN_FILLS`)
and writes its box as `route.hide`, which the page masks the dashes out of.

On the page, `drawRoute()` in app.js draws the drive on a layer of its own
(`.routelayer`: under the lettering and the bulbs, in map units) as three
dashed strokes sliding at 18 units a second, animated with SMIL: a navy
shadow (6 on, 4 off) so the white reads on the grey road, red dashes (6 on,
14 off) and white dashes the same but half a period along, so the two take
turns. Under `prefers-reduced-motion` the dashes stand still.

`chevrons.json` still holds the lifted clusters and `routepath` the raw
stretches, in case either is wanted again.

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

### Bulb colours

**No two bulbs within 47 page units of each other share a colour** — about two
bulbs either way along the cord (50 until the 7 Nov 2026 lineup). 12, 13 and 14 all came off the artwork red,
which on the map reads as one smudge and in the list looks like a mistake.

**Except a participant's own two bulbs, which must match each other.** They
are one business with two displays, so they wear one colour. This is why the
exception has to exist: 12 and 13 are both Alpine Communications and sit 24
apart, closer than any other pair on the map, so the first rule would
otherwise be exactly the thing pulling them apart.

**And neighbours in the list differ.** Spot n and spot n+1 never share a
colour unless they are one participant's pair, so the list alternates as the
map does.

**Three colours are hers to name**: K8Ki Design Studio (14) gold, EXIT
Driftless Group (17 and 70; 16 and 70 until 11 Nov 2026) blue, Pattison
Company (62 and 63) grey.
`PINNED` holds them, and the clearance rule holds for them too. On 7 Nov 2026
Ketaki let the rest go -- "rest can be whatever ... alternate them so same
colors are not close" -- so her earlier picks (Fidelity gold, Pattison red,
Elkader Fitness red, Turkey River grey, Art in the Park not red) are gone;
Fidelity Bank in particular is no longer gold beside K8Ki.

Within those rules the colours are spread as far apart as a search can get
them: every pair of same-coloured bulbs closer than 90 costs more the closer
it is, and `_build/colour_spread.py` (simulated annealing, 400 restarts, about
a minute) makes the total as small as it can, then keeps the four colours
near even, and only last, as a tiebreak, Canva's own colour. It prints the
table. Against v102's colours, same-colour pairs within 55 went from 13 to 8,
within 60 from 23 to 15, within 70 from 41 to 33. `RECOLOUR` in
`build_data.py` holds the result: fifty of the seventy bulbs differ from
Canva's. The spread is 17 red, 18 gold, 18 blue, 17 grey. Red is Canva's own,
`#bd7055`.

```bash
~/.venvs/elkader-map/bin/python colour_spread.py . sources/map-canva-p2.pdf 47 90 /tmp/colours.json
```

47 is as far as the first rule goes on this lineup. Where the right-hand road
runs beside the outer one, eleven businesses (9-12, 26-27 and 42-47) stand so
close that at 47.5 there is no four-colouring left to find. It was 50 before
those bulbs were there.

The trace actually returns several hex values for four colours — `#ac685b`
is the same red as `#ac6455` (and the 6 Nov 2026 export samples that red a few
points lighter again, as `#bd7055`, `#bd745a` and `#c1795f`, and the 7 Nov
export as `#b67d68` and `#bb7c65`), `#bbbbbb`, `#cdcdcd` and `#a7a7a7` the
same grey as `#c7c7c7`, none of them tellable apart on screen. `BULB_PALETTE` snaps them to
the four real colours first, so "a different colour" means a visible one.

**These are the page's colours and the page's alone.** The Canva file keeps
the originals, and Ketaki has said not to change it to match — so a printed
map and this one will differ, on purpose.

Four checks run on every build and fail it rather than shipping something
wrong: `check_bulb_clearance()` for the first rule, `check_pairs_match()` for
the second, `check_list_alternates()` for the list, `check_pinned()` for hers. The table was worked out against the artwork as it stands; if
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

**The map opens filling the height, on every screen, and cannot be zoomed
out past it.** `minScale()` is `stage.clientHeight / cropPx().h * OPEN`, with
`OPEN = 1`, and it is both the opening view and the floor `setScale()` clamps
to — so the height is the one thing that never changes, whatever screen the
page is on: top edge at the top of the box, bottom edge at its foot (on a
phone, on the MAP / DISPLAYS bar), no white above or below.

`OPEN` stood at 0.8 for part of 28 Oct 2026 — Ketaki asked for the map 20%
smaller, then for it to meet the top and bottom edges again — so if the
embed's box on the GoDaddy site ever ends up the wrong height for it, `OPEN`
is still the one number to change.

Wherever filling the height leaves the map wider than the box — a phone, or a
short frame — it runs off the sides and you pan across it. Shrinking the whole
map down to a narrow screen makes sixty business names unreadable, and reading
them is what the page is for.

The button bottom right returns to that same view. There is no "fit the whole
map" any more; it would have had to break the floor to do it.

## Sponsor credit

On a computer: bottom right of the map, just left of the zoom buttons, on
one bottom line with them, with no card behind it -- light lettering and the
gold wordmark straight on the navy (13 Nov 2026, v115). Before that it stood
bottom left on a card (v109-v114: white, then navy once the map went navy),
and beside the buttons with no card before v109. On the navy ground nothing
needs the card. It covers no bulb in any window 1152px wide or more; in a
1024x640 window it touches the edge of bulb 6, and on an upright tablet
(768 wide) its lettering lies over bulbs 2-4 until the map is panned.

Set the way Ketaki set it in Canva, as four centred lines:

```
   Interactive Map
Designed & Sponsored by
       [ K8Ki ]
    DESIGN STUDIO
```

Both are children of `.corner`, a flex row that stands clear of the open
list (`--list-w`). On a phone `.corner` takes no room of its own and each is
placed apart: the zoom column bottom right, the credit bottom left.

Tapping it opens K8Ki's own display, spot 14, the way picking it from the
list does: the bulb lit, the map brought round to it, the card open. Until
8 Nov 2026 (v104) it linked to <https://www.studiok8ki.com/>; Ketaki asked for
the bulb instead, and the card it opens carries the website, Facebook and
Instagram. Both copies (`.corner .credit` and the phone's `.credit-foot`) are
`<button data-open="14">`, and app.js opens whichever spot that number names,
so if K8Ki's spot is ever renumbered, change `data-open` in `index.html`.

On a phone it is on the map as well as at the foot of the list (8 Nov 2026;
until then it was only at the foot). It stands bottom left, small, on a
white card, and rides up over a sheet the way the zoom buttons do on the
right. Ketaki's choice (v107), after builds with it top left (v105) and
bottom right beside the zoom buttons (v106, where it sat over bulbs 2-4 in
the opening view). Bottom left covers no bulb, only the mailbox and sign
labels. The credit is the list-foot size on a phone 812px tall or taller and shrinks
with shorter screens, as the map does (`--k` in style.css).

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
no file may overwrite, which is how K8Ki's yellow mark from the brand kit
stays put. `NO_LOGO` is for spots that must not show one at all.

Logos are named after the **business**, not the file they came from, so the
same logo keeps one name however it is spelled in the folder. Anything in
`assets/logos/` that nothing points at is deleted on each run — so taking a
file out of `Logos/` takes it off the map.

They are saved as WebP, about a third the size of PNG with the transparency
intact, and a card loads only its own, so nobody downloads every logo for a
map they never tap.

### Logos that are more than a logo

Two treatments in `extract_logos.py`, keyed by the file's name; the file in
`../Logos` stays exactly as it was sent:

* `CROP` cuts a file down to the logo. Bennington Construction sent a
  Facebook banner, so the card shows the lettering and mark without the strip
  of photos under them; the Elkader Police Department's white lettering keeps
  a band of its black ground round it.
* `FLAT_BG` takes off a flat coloured ground the way white comes off (only
  what is reachable from the edge, faded at the margin): River Sound Co-op's
  watercolour came on grey, and sits on the card's white instead.
* `PHOTO` shows a photo just as it was sent, only scaled down: no trim, no
  crop, nothing made clear. Foundations Wealth Partners' card shows the photo
  of their booth they sent. (`INK`, which keeps only the ink of lettering
  photographed on cloth, is there too but unused: Ketaki wanted the photo
  itself rather than a logo recreated from it.)

### A photo with the logo over it

`COMPOSE` in `extract_logos.py` builds a card image from a photo with a logo
laid over its corner. K8Ki Design Studio's card (spot 14) is Ketaki at work
with a client -- DSC_2628 from the 2020 website photos, kept as
`_build/sources/k8ki-studio-photo.jpg` -- with the K8Ki lock-up small in the
bottom-right corner: the mark in white with DESIGN STUDIO under it, set the
way the sponsor credit sets it, straight on the photo with no background and
a soft shadow so the white reads on the pale patches. It replaced the plain
K8Ki mark on that card on 6 Nov 2026. The mark is rendered from
`assets/k8ki-logo.svg`, the credit's own file, recoloured white.

The photo is 3:2 and the card's logo box 301 x 150, so at first it stood 225
wide with a margin either side. Ketaki asked for it bigger (7 Nov 2026): the
build now crops it to 2:1 (`aspect`, with `crop_y` placing the window a little
below the middle), and a rule in `style.css` for any `*-photo.` image lets it
run the card's full width at 2:1 rather than inside the box -- 301 x 150 on a
wide screen, 343 x 172 on a phone, where the box is wider than 2:1.

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
* the search box, which carries the display count
  ("Search 70 displays by name or number")
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

## Floral Hall and the special events

Floral Hall is the one building on the map you can tap. It is blue, the
colour every building used to be, it carries a gold glow that breathes the
whole time the map is open (steady while its page is open, under the
pointer, and under `prefers-reduced-motion`), and its label reads SPECIAL
EVENTS / AT FLORAL HALL rather than the name alone — `drawText()` swaps the
two lines in for Canva's one. The glow is the building's own outline:
`hall_outline()` in `optimise_svg.py` lifts the traced path into
`hall.json`, `build_data.py` carries it into `data.js` as `hall.d`, and
`drawHall()` strokes it twice in gold in the lettering layer, blurred for
the light and crisp for the edge. A box round the building never lined up,
because the trace sits at a slight tilt. Tap it and the special events — hot chocolate every Saturday 5–7pm, and the
themed nights — take the panel over from under the show logo to the foot: a
blue-washed head with the title and the Saturday line, the intro, then one
row per night with a calendar tile (month, day, weekday) beside what happens
and who hosts, and the Facebook page as a button pinned at the foot. The
search, the names and the card step aside behind it until the ×; picking a
bulb while it is open closes it and shows that display's card. On a phone the
same page rises as the sheet, taller than a display card, with the hall
brought up into view above it; the handle pulls it down to the title.

It is one element, `#events`, placed in the panel after `.panel-top` on a
wide screen and moved out to `.hls` on a phone by `placeCard()`, exactly as
the card is. `panel.events-open` is what hides the list behind it.

**The programme lives in `index.html`**, in the `<template id="eventsCard">`
at the foot of the page, as ordinary HTML: two lead paragraphs, then one
`<li>` per night carrying its date as `data-date="2026-12-05"` and up to
three lines — `.ev-title` for what happens, `.ev-what` for the detail,
`.ev-host` for who hosts; leave out any that do not apply. `fillEvents()`
copies it in the first time the page opens and draws the tile from the date,
so a new night is a new `<li>`. It is deliberately not in `data.js`, which
the build rewrites. Dates are listed in the order they fall.

The blue is put on by `blue_floral_hall()` in `optimise_svg.py`, which finds
the building by its box in page units (`FLORAL_HALL_BOX`, the shape under the
FLORAL HALL label), recolours both the plain shape and the clipped rectangle
the tracer paints over it, and stops the build if nothing is there. The tap
target is the same box, `FLORAL_HALL` in `app.js`, sized like the bulb
markers so it grows with the map. If the artwork ever moves, both boxes move
with it.

## Links on the card

Website, Facebook and Instagram, read off the participants spreadsheet by
`_build/read_links.py`. The sheet keeps them all in one Website column —
sometimes several in a cell, separated by commas or just spaces — so they are
sorted by what the URL points at rather than which column they sat in.

Only the participant name and those links are taken. That sheet also carries
contact names, phone numbers, emails and payment records, none of which may
reach a published page.

Since 7 Nov 2026 the source is the committee's live Google Sheet (its
Participants tab), which Ketaki sent "for website links". Its Participant
and Website columns, rows 2-62 -- the participants, not the list of
prospects under them -- are copied by hand into
`_build/sources/participant-websites.csv`, and nothing else from the sheet
is copied anywhere.

The live sheet has the one Website column, and most rows give only the
website there -- so read alone it lost 30 Facebook pages and K8Ki's Instagram
that the October `.xlsx` had, and Ketaki asked for them back. `read_links.py`
reads both now, the live CSV first: the first sheet is the source for
websites, and the older one adds every Facebook or Instagram page the first
lacks (the same page written two ways, `profile.php?id=N` and `/p/Name-N/`,
counts once), and a website only where the first gives none (Clayton County
SXS Riders, Scoop-abowl, Elkader Chiropractic's Google listing). A bare domain ("riseltd.org") gets `https://`, and tracking added when a
link was copied out of Facebook (`fbclid`, `utm_...`) comes off.

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

`HAND_LINKS` replaces a kind outright, so it also corrects the sheet. The live
sheet gave Rapid Innovation & Yellow Iron cjmoyna.com and the CJ Moyna pair
mobiletracksolutions.com alone. Yellow Iron Equipment has its own site,
yellowironequip.com (its contact address is at cjmoyna.com, hence the mix-up),
and Rapid Innovation a Facebook page whose website, rapidinnovation.us, is a
parked domain -- so the pair links to those two, and the CJ Moyna pair has
cjmoyna.com back beside the MTS site.

```bash
python3 ../_build/read_links.py ../_build/sources/participant-websites.csv ../_build/sources/participants.xlsx
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
up for them in either source. St Joseph Catholic Church asked for theirs off
(spots 60 and 61 since the 6 Nov 2026 lineup).

## Swapping printed numbers

`SWAP_NUMBERS` in `build_data.py` exchanges two numerals on the artwork's own
text spans, so the marker and the label move together and stay on the same
bulb as each other. 12 and 13 were swapped there under the old numbering;
the list is empty now. A numeral that is simply wrong is corrected by
position instead, with `NUMBER_FIXES` (see "The 1-67 lineup").

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

Top left of the page, in small type: the version and the date it was built
(bottom left until 8 Nov 2026, when the sponsor credit took that corner).

It is there because this page caches hard, and a stale copy is pixel-identical
to a fresh one — an afternoon went into chasing "blurry edges" that turned out
to be a browser quietly serving the previous build. If the stamp does not say
what you expect, you are looking at an old copy, and that is worth knowing
before reporting anything else.

`stamp.py` also re-keys every `?v=` in `index.html` to a hash of what the
assets actually contain. That is the part that stops the stale copy being
served at all; the stamp is so a person can confirm it.

**The stamp is for previews only and never shows on the live site.** The
live site is the GoDaddy page, which frames the map from GitHub Pages, so
`isLivePage()` in `app.js` hides the stamp whenever the page is framed by
anything but a known preview host (the claude.ai artifact view, a local
server) — and when it is framed and the referrer has been stripped, which is
taken as live, since a stamp on the City's page is the one outcome this must
never produce. `LIVE_HOSTS` stays for a day the map is served from the
City's own domain. Opened directly, the GitHub Pages link still shows the
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
