# Timetable Gacha (教材オープンデータでつくる、時間割ガチャ)

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

This project provides a suite of tools for generating and displaying educational material schedules using open data. It allows users to create random timetables, search for specific materials, and embed curated lists of resources directly into their own websites.

## Demos

- **[Timetable Gacha](https://code4fukui.github.io/timetable/)**: Generate a random weekly timetable by selecting criteria like grade level, subject, and language.
- **[Material Search](https://code4fukui.github.io/timetable/search.html)**: Search for educational materials by keyword and filter by various categories.
- **[Embed Sample](https://code4fukui.github.io/timetable/test_emb.html)**: See a live example of the embeddable material list component.

## Key Features

- **Random Timetable Generation**: Automatically creates a randomized weekly schedule from a CSV open data source.
- **Flexible Filtering**: Narrow down materials by target grade, subject, language, and type (e.g., video, text).
- **Material Search**: Easily find specific resources with a keyword and category-based search interface.
- **Simple Embedding**: Integrate a dynamic list of educational materials into any website with a single line of HTML.

## How to Embed the Material List

You can easily display a list of educational materials on your own website by adding a single `<script>` tag to your HTML.

1.  **Prepare Your Data**: Create a CSV file with your list of materials. You can use our [sample CSV](https://code4fukui.github.io/timetable/data/funs.csv) as a template. Host this file online (e.g., using GitHub Pages).
2.  **Embed in HTML**: Paste the following code into your HTML file. Replace the `data-src` URL with the URL of the CSV file you prepared in step 1.

```html
<script data-type="timetable" data-src="https://code4fukui.github.io/timetable/data/fukuicedjp.csv" type="module" src="https://code4fukui.github.io/timetable/emb_fukui.mjs"></script>
```

## Open Data

This project utilizes the following open data sources:

- [https://code4fukui.github.io/timetable/data/funs.csv](https://code4fukui.github.io/timetable/data/funs.csv)
- [https://code4fukui.github.io/timetable/data/funs.json](https://code4fukui.github.io/timetable/data/funs.json)

## Showcase

This project's data and tools are used in other applications:

- **Ie de Manabou! (いえでまなぼう！)**
  - [https://applepedlar.github.io/iemana/](https://applepedlar.github.io/iemana/)

## Attribution

This application was created by [Taisuke Fukuno (福野泰介)](https://fukuno.jig.jp/).

## License

This project is licensed under the MIT License.