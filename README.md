# nixfred.com.v5 — The Laboratory

Cinematic scroll site. Candidate to become the next nixfred.com.
Live at https://v5.nixfred.com (Cloudflare Pages, direct upload).

## How it works

There is no video on this page. A film is generated with AI, then **broken up
into numbered WebP stills** (`assets/frames/frame_0001.webp`...). About 60 lines
of vanilla JS in `index.html` preload the frames, map scroll progress to a frame
index, and draw to a full-viewport canvas. Scrubbing backward is free because it
is image selection, not video seeking. All UI animates with transform and
opacity only. No dependencies, no build step.

Current reel: **180 placeholder frames** (ffmpeg-generated gradient drift).
The real film replaces them without code changes beyond `FRAMES.count`.

## The film pipeline (when generating the real six rooms)

Theme: physics meets steampunk with a touch of cyberpunk. One continuous
camera move through six rooms, 6 clips x 6 seconds = 36s.

**Tool:** Google Flow (labs.google/flow).

1. **Reference stills** — Image mode, Nano Banana Pro, 16:9. Free, iterate hard.
   Keep the left third of frame calm (headlines live there). No text in frames.
2. **Clips** — Video mode, *Frames mode* (start from approved still),
   model Omni Flash, 6 s, 16:9, 1 output. ~10 credits per clip.
3. **Seam chaining** — extract the last frame of clip N, use it as the start
   image of clip N+1:
   ```
   ffmpeg -sseof -0.1 -i clipN.mp4 -frames:v 1 -q:v 2 clipN_last.png
   ```
4. **Join + upscale** — concat with no fades (seams already match), scale to
   1600x900, light sharpen:
   ```
   printf "file 'clip%d.mp4'\n" 1 2 3 4 5 6 > list.txt
   ffmpeg -f concat -safe 0 -i list.txt -c copy film_raw.mp4
   ffmpeg -i film_raw.mp4 -vf "scale=1600:900:flags=lanczos,unsharp=5:5:0.4" film.mp4
   ```
5. **Break up into frames** — the `%04d` counter is mandatory (without it
   ffmpeg writes one animated file and the engine breaks):
   ```
   ffmpeg -i film.mp4 -vf fps=12 -c:v libwebp -quality 72 assets/frames/frame_%04d.webp
   ```
6. Update `FRAMES.count` in `index.html` to the new frame total.

### The six rooms (director script)

Global style block, prepended to every Flow prompt:

> Cinematic continuous dolly shot through a vast Victorian physics laboratory.
> Polished brass instruments, dark oak, oxidized copper pipes, warm gaslight,
> drifting dust motes, faint steam. Subtle cyan neon accents glow within the
> brass machinery, growing stronger deeper into the lab. Photorealistic, film
> grain, shallow depth of field, anamorphic 16:9. Left third of frame kept
> visually simple and dark. No text, no letters, no signage, no people.

| # | Room | Site section | Scene | Motion |
|---|------|--------------|-------|--------|
| I | The Study | Identity | Scholar's study: leather chair, telescope, books, chalkboard equations, walrus tusk paperweight, cyan-glowing double doors | Dolly forward, doors swing open |
| II | The Orrery | The system / fleet | Cathedral rotunda, giant brass orrery, glowing spheres on brass arms, cyan threads linking them | Glide forward and up beneath the orrery |
| III | The Difference Engine | The work | Colossal brass computing engine, gears, punch cards, cyan lights blinking in patterns | Track forward along the machine |
| IV | The Cloud Chamber | The ideas | Dark observatory, giant glass cloud chamber, spiraling particle trails, star charts | Move around then toward the glass |
| V | The Archive | Portfolio | Gallery hall of brass-framed glowing screens, mist, cyan portal at the end | Steady dolly down the center |
| VI | The Terminal | Contact | Through the portal: brass edged in neon cyan and magenta, holograms, rain, glowing terminal | Push through portal, settle on terminal screen |

Screens in V and the terminal in VI stay blank in the film; real content is
layered in HTML.

## Local dev

```
python3 -m http.server 8080
```

## Deploy

```
wrangler pages deploy . --project-name nixfred-com-v5
```
