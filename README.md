# VA-Usage project website

Project page for **From Design to Use: Understanding Documented Usage of Visual Analytics Systems**.

The site presents the paper, three-layer knowledge base, Explorer, extraction framework, corpus analysis, workflow prediction study, and all 183 corpus papers.

## Local preview

Run `python3 -m http.server 8765` in this directory and open `http://localhost:8765/`.

## Content

- `index.html`: paper text, figures, analysis overview, three findings, and complete corpus table.
- `static/css/index.css`: responsive page styles.
- `static/js/index.js`: corpus search/sort and schema field dictionary.
- `static/js/prediction.js`: three prediction examples, including all six models and three rounds in both conditions.
- `static/data/prediction/`: frozen study inputs, reference evidence, and predictions for ECoalVis (`p04_prefix01`), CommonsenseVIS (`p17_prefix01`), and Action-Evaluator (`p11_prefix01`).
- `assets/2-schema/examples/`: current Tac-Simur, DemographicVis, and RuleMatrix records and evidence.
- `assets/paper.pdf` and `assets/figures/`: the fixed paper and its original figures. The corresponding web images are in `static/images/`.
- `static/data/corpus.json` and `static/data/paper-list.xlsx`: complete corpus resources.

The homepage uses plain HTML, CSS, and JavaScript and is served directly by GitHub Pages. The existing `explorer/` application has its own build and data configuration.

## Updating the paper

Update the title, abstract, original figures, raster previews, statistics, and the sample data together. The model/round scores in the prediction viewer are individual results; the sample averages combine 18 predictions per condition. Do not replace one with the other.

The schema modal reads `static/schema/schema-browser.json`; its example links point to the current records under `assets/2-schema/examples/`.

The original website template was adapted from the [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template).
