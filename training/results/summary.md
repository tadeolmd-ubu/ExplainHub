# Fine-tune evaluation — three-way summary

Same held-out set, same production prompt, same decoding settings for every
model. The prompt is `buildMdEnhancer` plus the raw Markdown; the output goes
through the production `stripCodeBlock` + `postProcess` path before scoring.

## Models

| Name | What it is |
|------|------------|
| `llama3:8b` | Llama 3 8B Instruct, Ollama's quantized base |
| `explainhub-docs` | v1: LoRA `r=16`, `alpha=32`, `lr=2e-4`, 3 epochs |
| `explainhub-docs-v2` | v2: LoRA `r=32`, `alpha=64`, `lr=1.5e-4`, 5 epochs |

Both adapters were trained on the same 26-row dataset and applied to
`llama3:8b` with Ollama's `ADAPTER` instruction (base weights are not merged).

## Held-out set

10 documents from `tadeolmd-ubu/Loteria-mexicana`, a repository that never
appears in training: 1 `README.md` plus 9 module docs. Decoding:
`temperature=0`, `seed=42`, `num_ctx=8192`, `num_predict=4096`.

## Aggregate metrics

| Metric | llama3:8b | v1 | v2 |
|--------|----------:|----:|---:|
| **Composite** | 81.4% | 80.5% | **84.1%** |
| Headings kept | 100.0% | 100.0% | 100.0% |
| Section recall | 100.0% | 100.0% | 100.0% |
| File table rows kept | 100.0% | 90.0% | **100.0%** |
| File name Jaccard | 100.0% | 93.3% | **100.0%** |
| Modules table rows kept | 100.0% | 100.0% | 100.0% |
| Exports not inflated | 100.0% | 100.0% | 100.0% |
| Description present | 50.0% | 50.0% | **60.0%** |
| Content fidelity | 32.0% | 37.6% | **40.6%** |
| Invented file names | 0.0 | 0.2 | **0.0** |
| Latency (ms) | 67,666 | 70,593 | 82,947 |

v2 vs v1: **+3.6 pp**. v2 vs `llama3:8b`: **+2.7 pp**.

## Per-document composite

| Document | llama3:8b | v1 | v2 | v2 − v1 | v2 − llama3 |
|----------|----------:|---:|---:|--------:|------------:|
| `README.md` | 75.3% | 77.2% | **87.7%** | +10.5 | +12.4 |
| `docs/AppLoteria.md` | **86.5%** | 56.7% | 79.3% | +22.7 | −7.2 |
| `docs/app.md` | 86.9% | 86.5% | **87.4%** | +0.9 | +0.5 |
| `docs/components.md` | 76.7% | **87.3%** | 86.5% | −0.8 | +9.9 |
| `docs/data.md` | **85.5%** | 76.8% | 77.9% | +1.0 | −7.6 |
| `docs/hooks.md` | 75.7% | 75.9% | **88.6%** | +12.7 | +12.9 |
| `docs/scripts.md` | 86.9% | **88.2%** | 87.5% | −0.7 | +0.6 |
| `docs/src.md` | **85.7%** | 90.0% | 81.1% | −8.9 | −4.6 |
| `docs/storage.md` | 78.5% | **88.8%** | 87.8% | −1.0 | +9.3 |
| `docs/utils.md` | 76.4% | 77.7% | 77.4% | −0.3 | +1.0 |

## Findings

- v2 is the best model overall and beats the base by 2.7 pp.
- The v1 failure mode is gone: v1 added `app.js` and `config.js` to the
  single-file `AppLoteria.md` table; v2 kept the table intact and improved that
  document from 56.7% to 79.3%.
- Content fidelity improves monotonically across the three models
  (32.0% → 37.6% → 40.6%), which is the clearest signal that the adapters learn
  the corrected prose.
- v2 still trails the base on `AppLoteria.md` (−7.2), `data.md` (−7.6) and
  `src.md` (−4.6). Those are short, sparse module docs where the base's literal
  copying is hard to beat.
- v2 is slower (82.9 s vs 67.7 s on the RTX 2050, partially offloaded to CPU).

## Caveats

- One held-out repository and 10 documents; the confidence interval is wide.
- Decoding is not bit-identical across sessions. `storage.md` flipped its
  description metric between runs because the model wrote a 7-word sentence in
  one run and a 10-word sentence in the other; the metric requires 10 words.
  The v1-vs-v2 numbers above come from the same session, so the comparison is
  internally consistent.
- The corrections used for training are seed corrections, not a full human
  review.

## Reproduce

```bash
# v1 vs the base model
node training/scripts/evaluate.mjs \
  --base llama3:8b \
  --tuned explainhub-docs \
  --limit 10

# v2 vs v1 on the same documents
node training/scripts/evaluate.mjs \
  --base explainhub-docs \
  --tuned explainhub-docs-v2 \
  --limit 10 \
  --out training/data/eval-v1-vs-v2
```
