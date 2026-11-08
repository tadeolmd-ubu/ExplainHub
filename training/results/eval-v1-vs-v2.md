# ExplainHub documentation enhancer — fine-tune evaluation

- Date: 2026-11-08T22:37:38.417Z
- Base model: `explainhub-docs`
- Fine-tuned model: `explainhub-docs-v2`
- Held-out documents: 10
- Composite delta: +3.6 percentage points

| Metric | Base | Tuned | Delta |
|--------|------|-------|-------|
| Composite score | 80.5% | 84.1% | +3.6 pp |
| Headings kept | 100.0% | 100.0% | +0.0 pp |
| Section recall | 100.0% | 100.0% | +0.0 pp |
| File table rows kept | 90.0% | 100.0% | +10.0 pp |
| File name Jaccard | 93.3% | 100.0% | +6.7 pp |
| Modules table rows kept | 100.0% | 100.0% | +0.0 pp |
| Exports not inflated | 100.0% | 100.0% | +0.0 pp |
| Description present | 50.0% | 60.0% | +10.0 pp |
| Content fidelity | 37.6% | 40.6% | +3.0 pp |
| Invented file names | 0.2 | 0.0 | -0.2 |
| Latency (ms) | 70593.4 | 82947.3 | +12353.9 |
| Output chars | 1367.4 | 1408.8 | +41.4 |

## What the metrics mean

- **Composite score** is the weighted mean of the structural and textual metrics below.
- **Headings kept** compares the ordered heading sequence of the output with the human correction.
- **Section recall** is the fraction of corrected headings that appear anywhere in the output.
- **File table rows kept** and **Modules table rows kept** check the table shapes the prompt forbids changing.
- **File name Jaccard** measures how many file names in the File Structure table match the correction.
- **Exports not inflated** checks that the model did not add rows the prompt forbids.
- **Description present** checks that README and module docs gained real prose, not just a table.
- **Content fidelity** is the word-set Jaccard against the human correction (higher is closer to the target prose).
- **Invented file names** counts files in the output that were not in the raw document or the correction.

The per-document outputs are in the companion JSON file.
