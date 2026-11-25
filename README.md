[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ujang201/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ujang201/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Sizzle & Serve — a tiny cooking game

The lunch rush is on! Order tickets arrive on the board with a countdown, and you build each dish on the plate from eight ingredient bins on the counter. Patties must be grilled (4s) and dough baked in the oven (5s) before they can go on the plate. Serve the exact dish an order asks for to score points, coins and a combo bonus; a wrong dish or an expired order costs one of three lives. A 2-minute shift, then the game-over screen with your score, dishes served and best combo — and a restart.

## Dishes

- 🍔 **Burger** — bun, patty (grilled), lettuce, tomato — $100
- 🥗 **Salad** — lettuce, tomato, cheese — $80
- 🍕 **Pizza** — dough (baked), tomato, cheese — $110
- 🍝 **Pasta** — noodle, sauce, cheese — $90

## How to play

- **Mouse:** click an ingredient bin to add it (patty goes to the grill, dough to the oven), click a finished item on the grill/oven to move it to the plate, click **SERVE** when the plate matches an order ticket.
- **Keyboard:** keys `1–8` pick ingredients, `Space` serves, `T` trashes the plate, `M` mutes, `Enter` starts, `R` restarts.
- **Scoring:** dish price + time bonus (2 pts per second left on the ticket) + combo bonus (10 pts per combo step). Expired orders and wrong dishes cost a life.

## Run it

No build step, no network: plain static files under `game/`. Serve them and open `game/index.html` in desktop Chrome:

```sh
node serve.ts   # http://localhost:8080
```

Screenshots are real renders of the game's own code, staged deterministically with `?shot=start|play|end&seed=1` (see `shots.json`). Sounds and the music loop are synthesized live with WebAudio — no audio files.

## Entry

`main.ts` copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored `vendor/makefun-game.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Original idea, art, sounds, music and names — built for the make.fun bounty "Make the best cooking game" (`best-cooking-game-20261125-0137`).

<sub>Entered on [make.fun](https://make.fun/?ref=fypbmabe&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
