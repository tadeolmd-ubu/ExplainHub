# Raw-document model comparison

- Raw directory: `/tmp/opencode/demo-pairs/learning-ts/raw`
- Models: `explainhub-docs` vs `explainhub-docs-v2`
- Documents: 12

There are no human corrections for this repository, so the raw document is
the reference. **Preservation** measures how much of the input structure
survived; it is not an absolute quality score, because a model that adds prose
necessarily moves away from the raw text.

| Metric | explainhub-docs | explainhub-docs-v2 |
|--------|---:|---:|
| Preservation | 86.7% | 87.9% |
| Headings kept | 100.0% | 100.0% |
| Section recall | 100.0% | 100.0% |
| File table rows kept | 100.0% | 100.0% |
| File name Jaccard | 100.0% | 100.0% |
| Modules table rows kept | 100.0% | 100.0% |
| Description present | 58.3% | 83.3% |
| Invented file names | 0.0 | 0.0 |
| Output chars | 1137.3 | 1214.4 |
| Latency (ms) | 66908.2 | 66228.3 |

## Per document

| Document | explainhub-docs preservation / invented / chars | explainhub-docs-v2 preservation / invented / chars |
|----------|---:|---:|
| `README.md` | 97.8% / 0.0 / 3419.0 | 92.8% / 0.0 / 3907.0 |
| `docs/20261019232726_init.md` | 91.1% / 0.0 / 522.0 | 82.9% / 0.0 / 473.0 |
| `docs/20261020213915_add_product.md` | 88.0% / 0.0 / 249.0 | 88.9% / 0.0 / 276.0 |
| `docs/20261028220918_add_product_sku.md` | 88.2% / 0.0 / 259.0 | 87.3% / 0.0 / 268.0 |
| `docs/20261030005011_add_category.md` | 90.0% / 0.0 / 270.0 | 90.6% / 0.0 / 257.0 |
| `docs/20261030005040_make_category_required.md` | 79.5% / 0.0 / 254.0 | 86.4% / 0.0 / 285.0 |
| `docs/20261104034502_rename_product_updated_at.md` | 88.8% / 0.0 / 270.0 | 87.0% / 0.0 / 309.0 |
| `docs/categories.md` | 82.8% / 0.0 / 3081.0 | 91.0% / 0.0 / 3212.0 |
| `docs/lib.md` | 82.2% / 0.0 / 661.0 | 81.6% / 0.0 / 659.0 |
| `docs/middlewares.md` | 86.2% / 0.0 / 1145.0 | 85.8% / 0.0 / 1236.0 |
| `docs/products.md` | 81.6% / 0.0 / 3072.0 | 90.9% / 0.0 / 3166.0 |
| `docs/src.md` | 84.8% / 0.0 / 445.0 | 89.7% / 0.0 / 525.0 |

Generated outputs are saved under the output directory, one subdirectory per
model. This report is not a replacement for `evaluate.mjs`: without human
corrections the target prose is unknown.

