# ExplainHub documentation enhancer — fine-tune evaluation

- Date: 2026-11-08T17:49:55.766Z
- Base model: `llama3:8b`
- Fine-tuned model: `explainhub-docs`
- Held-out documents: 10
- Composite delta: -1.9 percentage points

| Metric | Base | Tuned | Delta |
|--------|------|-------|-------|
| Composite score | 81.4% | 79.5% | -1.9 pp |
| Headings kept | 100.0% | 100.0% | +0.0 pp |
| Section recall | 100.0% | 100.0% | +0.0 pp |
| File table rows kept | 100.0% | 90.0% | -10.0 pp |
| File name Jaccard | 100.0% | 93.3% | -6.7 pp |
| Modules table rows kept | 100.0% | 100.0% | +0.0 pp |
| Exports not inflated | 100.0% | 100.0% | +0.0 pp |
| Description present | 50.0% | 40.0% | -10.0 pp |
| Content fidelity | 32.0% | 37.6% | +5.6 pp |
| Invented file names | 0.0 | 0.2 | +0.2 |
| Latency (ms) | 67666.3 | 68893.1 | +1226.8 |
| Output chars | 1372.5 | 1351.5 | -21.0 |

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
