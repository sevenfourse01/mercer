# Mercer

TMA's business planning tool. Answer questions about your business, or the one you want to start,
watch it take shape as a tree, and leave with a plan you can act on.

**Live:** https://sevenfourse01.github.io/mercer/

## What is here

| Path | What it is |
|---|---|
| `docs/` | the site GitHub Pages serves: the same files, minified |
| `source/` | the readable source every file in `docs/` was built from |
| `source/tests/` | the node suites (about 1,500 checks) |

No build step is needed to run it. The page is plain ES modules and CSS: serve `source/` or
`docs/` with any static server and open it.

```bash
npx serve source
```

## How it works

Every figure comes from `econ.js`: the operating model, a reconciled baseline with each value
marked observed, estimated or unknown, dated acquisition flows, resource-constrained delivery,
separate cost and cash schedules, and intervention comparison. Scenarios carry an output mode
(`requirements`, `illustrative`, `operating_scenario`), and nothing in this build claims a
validated forecast, because there is no historical series here to backtest against. The numerical
view is called Scenarios for that reason.

`engine.js` is a frozen funnel-and-constraint Monte Carlo kept as one optional demand view. It is
never the source of a figure the plan prints.

The page sends none of your answers anywhere. It loads its fonts from Google Fonts and its drawing
and PDF libraries from jsDelivr and cdnjs when it opens, and everything else runs in the browser.

## Known

- Three Klim font files 404 on every load: the faces are licensed and not ours to bundle. Newsreader
  and Figtree stand in.
- Safari, Firefox, real phones and screen readers are untested.
