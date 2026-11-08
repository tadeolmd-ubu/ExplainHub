# ExplainHub documentation-enhancer fine-tune

This directory contains a reproducible fine-tuning project for the model that
turns ExplainHub's raw generated Markdown into polished project documentation.
It is a **fine-tune**, not a from-scratch model: the base is Llama 3 8B
Instruct, adapted with 4-bit QLoRA using [Soup](https://github.com/MakazhanAlpamys/Soup).

The project is versioned with the application so the prompt, the dataset
contract, the training config, and the evaluation live next to the code they
serve.

---

## Why the dataset looks the way it does

`AiEnhancer.enhanceMarkdown` calls Ollama with a single prompt built by
`src/modules/ai-enhancer/prompt/promptMdEnhancer.js`:

```text
user      = buildMdEnhancer(rawMarkdown, language)
assistant = human-corrected Markdown
```

The training row uses **exactly** that prompt, imported from the application at
build time. Nothing is paraphrased or re-written in the training folder, so the
model cannot drift away from production.

Each row is ChatML:

```json
{
  "messages": [
    { "role": "user", "content": "<full production prompt + raw Markdown>" },
    { "role": "assistant", "content": "<corrected Markdown>" }
  ]
}
```

The row container is ChatML, but the model is Llama 3, so both configs set
`data.chat_template: llama3`. Ollama applies the same Llama 3 template in
production.

`data.train_on_responses_only: true` masks the long prompt and trains only on
the corrected Markdown. The model still conditions on the prompt through
attention.

---

## Directory map

```text
training/
├── soup.yaml                  # real run: Llama 3 8B, QLoRA, 6144 tokens
├── soup.smoke.yaml            # local 1B pipeline check, not a usable model
├── scripts/
│   ├── build-dataset.mjs      # raw docs -> ChatML rows
│   ├── make-example.mjs       # regenerates data/example.jsonl
│   ├── evaluate.mjs           # base vs fine-tuned on held-out repos
│   └── lib/
│       ├── markdown-contract.mjs
│       └── metrics.mjs
├── datasets/
│   ├── manifest.json          # repos, and their train/eval split
│   └── pairs/
│       └── <repo>/
│           ├── raw/           # snapshot of the generated docs (source of truth)
│           └── corrected/     # the same paths, edited by hand
├── repos/                     # git-ignored clones used by --refresh-raw
├── data/
│   ├── example.jsonl          # two real rows, committed
│   ├── train.jsonl            # generated, git-ignored
│   ├── eval.jsonl             # generated, git-ignored
│   └── eval-ref.jsonl         # generated sidecar with raw + corrected docs
├── colab/soup-explainhub.ipynb
└── README.md
```

The `raw/` snapshot is deliberately committed. If the source repository changes,
regenerating it should be an explicit decision, not something that silently
changes the prompts behind already-corrected targets.

---

## Requirements

- **Node.js 20+** for the dataset scripts.
- **Soup 0.77+** installed with Python 3.11-3.13. Fedora 44 ships Python 3.14,
  which Soup does not support, so install it through `uv`:

  ```bash
  uv tool install --force --python 3.13 "soup-cli[train]"
  soup --version
  soup doctor
  ```

- **A CUDA GPU** for training. The local RTX 2050 (4 GB) is only enough for the
  1B smoke test. The real 8B run needs a 16 GB T4, 24 GB L4, or 40 GB A100
  (Colab, Kaggle, or a rented GPU).
- **Liger Kernel** for the 16 GB path:

  ```bash
  /usr/bin/python3 -m pip install "liger-kernel==0.8.5"
  ```

  `soup.yaml` sets `training.use_liger: true`. Liger fuses the LM head and the
  cross-entropy into a chunked linear loss, so the full
  `(sequence × vocabulary)` logits tensor is never materialized. Without it Soup
  predicts ~25 GB at 6144 tokens; with it, the run fits a T4.

  Do **not** use `cut-cross-entropy` here: every PyPI wheel omits the
  `cut_cross_entropy.transformers` patch that Soup imports, and the upstream
  patch still targets `transformers` 4.x (it imports `KwargsForCausalLM`, which
  was removed in `transformers` 5). Soup then logs
  `Cut Cross-Entropy: no matching architecture or cut_cross_entropy not
  installed` and falls back to the logits tensor that OOMs the T4. Liger 0.8.5
  requires `transformers>=5`, which is what Colab ships.
- **Ollama** for deployment and evaluation.

The base config uses the public `unsloth/llama-3-8b-Instruct` mirror. If you
prefer the official checkpoint, accept the license on Hugging Face, run
`huggingface-cli login`, and uncomment the `meta-llama/Meta-Llama-3-8B-Instruct`
line in `soup.yaml`.

---

## Build the dataset

### 1. Choose repositories

Edit `datasets/manifest.json`. Every repository gets an `id`, a `split`, and
either a `path` (for `--refresh-raw`) or `null` when its snapshots are already
committed.

```json
{
  "id": "my-repo",
  "path": "/home/me/projects/my-repo",
  "split": "train",
  "note": "Node.js API used for training"
}
```

`split` is **repository-level**:

- `train` — rows go to `data/train.jsonl`.
- `eval` — rows go to `data/eval.jsonl` and are never trained on.
- `ignore` — skipped.

Do not split by document. README and module docs from the same repository share
vocabulary, file names, and architecture; a random row split would leak them
into validation and make the evaluation look better than it is.

The checked-in manifest uses `Loteria-mexicana` as the held-out repository:

```bash
git clone --depth 1 \
  https://github.com/tadeolmd-ubu/Loteria-mexicana.git \
  training/repos/loteria-mexicana
```

Its `raw/` and `corrected/` snapshots are committed, so training and evaluation
work without the clone. The clone is only needed to refresh those snapshots.

> **Refresh only one repository at a time.** `--refresh-raw` walks every
> directory under the target path. Because `training/repos/` lives inside this
> repository, refreshing ExplainHub while the held-out clone exists would add
> the clone's modules to the ExplainHub snapshot and inflate its project tree.
> Use a temporary one-repo manifest (or move `training/repos/` out) when
> refreshing. The committed snapshots are the source of truth.

### 2. Snapshot the raw docs

```bash
node training/scripts/build-dataset.mjs --refresh-raw
```

This runs the real ExplainHub pipeline
(`StructureExtractor` → `CodeParser` → `TextGenerator`) and writes:

```text
datasets/pairs/<id>/raw/README.md
datasets/pairs/<id>/raw/docs/<module>.md
```

If a snapshot already exists, the script writes the candidate to `raw.next/`
instead of overwriting it. Diff the two, then re-run with `--force` if you
really want to replace the tracked snapshot.

### 3. Correct the docs by hand

Copy the raw tree and edit only the prose:

```bash
cp -r datasets/pairs/my-repo/raw datasets/pairs/my-repo/corrected
```

The correction must obey the same contract the production prompt states:

- keep every heading, in order, with no new sections;
- do not add or remove File Structure, Modules, Functions, or Routes rows;
- in Exports, you may remove `undefined` and duplicate rows, never add;
- improve the Purpose/Description text and add the missing prose descriptions;
- keep the project tree exactly as generated.

The builder checks those rules before a row enters the dataset. Invalid rows are
reported and skipped; `--strict` turns them into a non-zero exit for CI.

The checked-in `datasets/pairs/explainhub/corrected/` and
`datasets/pairs/loteria-mexicana/corrected/` trees are **seed corrections**:
they were bootstrapped from the raw snapshots so the project has a working
dataset, and they still deserve a review pass. Edit the prose and re-run the
builder before freezing the dataset for a final training run.

### 4. Build the rows

```bash
node training/scripts/build-dataset.mjs \
  --strict \
  --require-corrections \
  --max-chars 20000
```

`--max-chars 20000` sends the one oversized document (`parsers.md`, 7773
tokens) to `data/long.jsonl` instead of truncating it at 6144. The remaining 26
rows fit the training context.

Outputs:

| File | Contents |
|------|----------|
| `data/train.jsonl` | ChatML rows from `split: train` repositories |
| `data/eval.jsonl` | ChatML rows from `split: eval` repositories |
| `data/eval-ref.jsonl` | `{id, repo, doc, chars, raw, corrected}` for evaluation |
| `data/long.jsonl` | Only when `--max-chars` is set and rows exceed it |
| `data/dataset.json` | Counts, repo commits, prompt hashes, per-row metadata |

`data/dataset.json` is the reproducibility record: it stores the SHA-256 of the
prompt builder and of the prompt template, the repository commits, the row
counts, and the list of long rows.

Useful flags:

```bash
# Fail on a correction that breaks the Markdown contract
node training/scripts/build-dataset.mjs --strict

# Also fail if any raw document has no correction
node training/scripts/build-dataset.mjs --strict --require-corrections

# Put rows over 12,000 characters in data/long.jsonl
node training/scripts/build-dataset.mjs --max-chars 12000
```

### 5. Validate the rows

```bash
soup data validate training/data/train.jsonl --format chatml
soup data stats training/data/train.jsonl
soup data doctor training/data/train.jsonl \
  --model unsloth/llama-3-8b-Instruct \
  --format chatml \
  --max-length 6144
```

With the checked-in 26-row set, the doctor reports `0/26` rows truncated
(longest row: 5881 tokens). The only remaining MINOR is the Llama 3 template
lacking `{% generation %}` markers, so answer-only masking uses Soup's
heuristic.

`data doctor` is the important one: it tokenizes the rows, checks the chat
template and the answer-only mask, and reports truncation risk. A row that is
truncated before its assistant turn teaches the model nothing.

The sample rows can be checked without building a dataset:

```bash
soup data validate training/data/example.jsonl --format chatml
```

---

## Train

### Real run

```bash
cd training
soup train --config soup.yaml --allow-oom-attempt
```

`--allow-oom-attempt` is needed because Soup's pre-flight gate prices the full
logits tensor even when `use_liger: true` removes it. With the fused loss, the
predicted peak at 6144 tokens is about 14 GB, inside a 16 GB T4.

The training command also sets an allocator flag that reduces fragmentation:

```bash
PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True \
  soup train --config soup.yaml --allow-oom-attempt
```

The log must contain this line before `Loading model`:

```text
Liger Kernel enabled: fused RMSNorm, SwiGLU, CrossEntropy, RoPE
```

If it says `Liger Kernel: no matching architecture found`, Liger is installed in
a different interpreter than the one running `soup`. Reinstall it with
`/usr/bin/python3 -m pip install "liger-kernel==0.8.5"` and verify with
`/usr/bin/python3 -c "import liger_kernel"`.

Key settings in `soup.yaml`:

| Setting | Value | Why |
|---------|-------|-----|
| `base` | Llama 3 8B Instruct | Same family as the installed `llama3:8b` |
| `task` | `sft` | Supervised fine-tuning on prompt → corrected doc pairs |
| `backend` | `transformers` | Works on T4/L4/A100 without extra CUDA wheels |
| `quantization` | `4bit` | QLoRA; the frozen base stays quantized |
| `lora.r` / `alpha` | 16 / 32 | Small adapter, enough capacity for style and structure |
| `data.max_length` | 6144 | Fits the README row (5871 tokens) on a 16 GB T4 with Liger |
| `training.use_liger` | `true` | Fused linear CE avoids the 11 GB logits tensor at 6144 tokens |
| `training.use_cut_ce` | `false` | Broken on `transformers` 5 and not shipped by the PyPI wheel |
| `batch_size` | 1 | A T4 cannot hold a larger micro-batch at 6144 tokens |
| `gradient_accumulation_steps` | 8 | Effective batch of 8 |
| `lr` | 2e-4 | Standard QLoRA learning rate |
| `epochs` | 3 | Small dataset; more epochs overfit the corrections |
| `save_steps` | 5 | The 26-row set is about 4 optimizer steps per epoch |
| `seed` | 42 | Reproducible data order and initialization |

If the T4 runs out of memory, lower `data.max_length` to 4096. The README row
will then be truncated, so rebuild with `--max-chars 16000` to move it to
`long.jsonl` alongside `parsers.md`. On an L4 24 GB or A100 40 GB, raise
`max_length` to 8192 and re-run `soup data doctor` with the new limit. For
2-5x faster training on CUDA, install `soup-cli[fast]` and set
`backend: unsloth`; Unsloth has its own fused cross-entropy, so remove
`use_liger` in that case.

### Local smoke test

The RTX 2050 cannot hold Llama 3 8B even at 4 bits. `soup.smoke.yaml` uses a 1B
model and the two committed sample rows to validate the dataset, template, mask,
and export path on this machine:

```bash
cd training
soup train --config soup.smoke.yaml
```

Treat the resulting adapter as a pipeline test, not as the deliverable.

### Colab

Open `colab/soup-explainhub.ipynb`, upload `training/data/train.jsonl`, and run
the cells. The notebook installs Soup plus `liger-kernel==0.8.5` into the
interpreter Soup runs, validates the rows, trains with `--allow-oom-attempt`,
exports a `q4_k_m` GGUF, and downloads it. Push the branch first so the cloned
repository contains the current `soup.yaml`.

---

## Export and deploy to Ollama

There are two routes. On a 16 GB machine, applying the adapter at load time is
the cheapest: it needs only the ~160 MB adapter, not a 5 GB merged GGUF.

### Route A — apply the LoRA adapter (no merge)

Ollama's safetensors adapter loader only looks for `model*.safetensors` and
`*.json` at the adapter root, so build a clean directory from the PEFT files.
(The PEFT name `adapter_model.safetensors` does not match, and the checkpoint
subdirectories would collide on `adapter_config.json`.)

```bash
tar xzf explainhub-docs-lora.tar.gz
mkdir -p adapter-ollama
cp explainhub-docs-lora/adapter_model.safetensors adapter-ollama/model.safetensors
cp explainhub-docs-lora/adapter_config.json adapter-ollama/adapter_config.json

cat > Modelfile <<'EOF'
FROM llama3:8b
ADAPTER ./adapter-ollama
EOF

ollama create explainhub-docs -f Modelfile
```

The base must match the adapter's base (`unsloth/llama-3-8b-Instruct` is the
same weights as `llama3:8b`). This route works on Ollama 0.34.0 and earlier;
0.34.1 removed `ADAPTER`.

### Route B — merge and export a GGUF

This needs ~16 GB of RAM to load the 8B base in fp16, so it does not fit free
Colab (~13 GB). Run it on a 24 GB machine, an L4/A100 VM, or Kaggle:

```bash
cd training
soup export \
  --model ./output/explainhub-docs-lora \
  --format gguf \
  --quant q4_k_m \
  --deploy ollama \
  --deploy-name explainhub-docs
```

If you downloaded only the GGUF, create a `Modelfile` next to it:

```text
FROM ./explainhub-docs.q4_k_m.gguf
```

and register it with `ollama create explainhub-docs -f Modelfile`.

Then point ExplainHub at the new model:

```env
OLLAMA_MODEL=explainhub-docs
```

Run a Markdown analysis. `AiEnhancer` will use `buildMdEnhancer`, which is the
same prompt the model trained on.

---

## Evaluate against the base model

The evaluation uses the held-out repositories in `data/eval.jsonl`. Both models
receive the same production prompt. The output goes through the same
`stripCodeBlock` + `postProcess` path as production, so the comparison reflects
what users would see.

```bash
node training/scripts/evaluate.mjs \
  --base llama3:8b \
  --tuned explainhub-docs \
  --limit 20
```

The script writes `data/eval-report.md` and `data/eval-report.json` and prints a
table like:

| Metric | Base | Tuned | Delta |
|--------|------|-------|-------|
| Composite score | ... | ... | ... |
| Headings kept | ... | ... | ... |
| Section recall | ... | ... | ... |
| File table rows kept | ... | ... | ... |
| File name Jaccard | ... | ... | ... |
| Modules table rows kept | ... | ... | ... |
| Exports not inflated | ... | ... | ... |
| Description present | ... | ... | ... |
| Content fidelity | ... | ... | ... |
| Invented file names | ... | ... | ... |

The composite is weighted toward structural fidelity (headings, files, table
shapes) and then toward similarity to the human correction. That matches the
product requirement: a polished document that invents a module is a regression,
not an improvement.

For a school presentation, report:

1. the dataset size and repository-level split;
2. the prompt hash and base checkpoint from `data/dataset.json`;
3. the training config and hardware;
4. the base-vs-tuned table on held-out repositories;
5. two or three side-by-side documents from `eval-report.json`.

---

## Reproducibility notes

- The prompt is imported from the application, not copied. `dataset.json`
  records `promptSha256` (the rendered template) and `promptSourceSha256` (the
  source file).
- The raw docs are committed snapshots. Rebuilding from a changed repository is
  an explicit `--refresh-raw` step.
- The train/eval split is by repository. `val_split: 0.0` avoids a second,
  random split that would leak rows.
- Training uses `seed: 42` and deterministic data order.
- The exact Soup version, base checkpoint, and quantization are in
  `soup.yaml`; `soup doctor` records the local CUDA/PyTorch environment.

---

## Troubleshooting

**`soup: command not found`** — install with
`uv tool install --force --python 3.13 "soup-cli[train]"` and make sure
`~/.local/bin` is on `PATH`.

**`soup data validate` rejects a row** — print the first line with
`head -n 1 training/data/train.jsonl` and check that it has a `messages` array
with a `user` and an `assistant` turn. Rebuild with the dataset script rather
than editing JSONL by hand.

**A correction is rejected** — the error names the section and the row count or
heading that changed. Fix the corrected file and rebuild. The contract is
intentionally strict because a row that breaks it would teach the model to break
it in production.

**Soup refuses to start with "Predicted peak VRAM … exceeds"** — the 8B config
is expected to trip the conservative gate. Pass `--allow-oom-attempt` and make
sure `liger-kernel` is importable from Soup's interpreter; without the fused
loss the run will not fit a 16 GB T4.

**CUDA out of memory** — first confirm the log says
`Liger Kernel enabled` and that `training.use_liger: true` is in `soup.yaml`.
If it still runs out, lower `data.max_length` to 4096 (then rebuild with
`--max-chars 16000`) or to 2048, keep `batch_size: 1`, and keep
`gradient_checkpointing: true`.

**`Liger Kernel: no matching architecture found`** — Soup runs under
`/usr/bin/python3` while `pip` may install into `/usr/local/bin/python`. Install
with `/usr/bin/python3 -m pip install "liger-kernel==0.8.5"` and verify with
`/usr/bin/python3 -c "import liger_kernel, transformers; print(liger_kernel.__version__)"`.

**The model repeats or never stops** — run `soup data doctor` and confirm the
assistant turn ends with the EOS token. Also check that `chat_template: llama3`
matches the base checkpoint.

**Gated model 401/403** — the config defaults to the public Unsloth mirror. If
you switch to the Meta checkpoint, accept the license and run
`huggingface-cli login`.
