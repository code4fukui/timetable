# Timetable Gacha (教材オープンデータでつくる、時間割ガチャ)

このプロジェクトは、オープンデータを利用して教材の時間割を生成・表示するツール群を提供します。ランダムな時間割の作成、特定の教材の検索、独自のウェブサイトへの教材リストの直接埋め込みが可能です。

## デモ

- **[時間割ガチャ](https://code4fukui.github.io/timetable/)**: 学年、教科、言語などの条件を選択して、ランダムな週間時間割を生成します。
- **[教材検索](https://code4fukui.github.io/timetable/search.html)**: キーワードで教材を検索し、さまざまなカテゴリで絞り込みます。
- **[埋め込みサンプル](https://code4fukui.github.io/timetable/test_emb.html)**: 埋め込み可能な教材リストコンポーネントの実際の動作例を確認できます。

## 主な機能

- **ランダムな時間割生成**: CSV形式のオープンデータから週間時間割を自動的にランダム生成します。
- **柔軟なフィルタリング**: 対象学年、教科、言語、種類（動画、テキストなど）で教材を絞り込めます。
- **教材検索**: キーワードとカテゴリベースの検索インターフェースで、特定の教材を簡単に見つけることができます。
- **簡単な埋め込み**: 1行のHTMLコードを追加するだけで、動的な教材リストを任意のウェブサイトに組み込むことができます。

## 教材リストの埋め込み方法

HTMLに`<script>`タグを1行追加するだけで、ご自身のウェブサイトに教材リストを簡単に表示できます。

1.  **データの準備**: 教材リストをまとめたCSVファイルを作成します。[サンプルCSV](https://code4fukui.github.io/timetable/data/funs.csv)をテンプレートとしてご利用いただけます。このファイルをオンライン（GitHub Pagesなど）でホストしてください。
2.  **HTMLへの埋め込み**: 以下のコードをHTMLファイルに貼り付けます。`data-src`のURLを、ステップ1で準備したCSVファイルのURLに置き換えてください。

```html
<script data-type="timetable" data-src="https://code4fukui.github.io/timetable/data/fukuicedjp.csv" type="module" src="https://code4fukui.github.io/timetable/emb_fukui.mjs"></script>
```

## オープンデータ

このプロジェクトでは、以下のオープンデータを利用しています:

- [https://code4fukui.github.io/timetable/data/funs.csv](https://code4fukui.github.io/timetable/data/funs.csv)
- [https://code4fukui.github.io/timetable/data/funs.json](https://code4fukui.github.io/timetable/data/funs.json)

## 活用事例

このプロジェクトのデータとツールは、以下のアプリケーションでも活用されています:

- **Ie de Manabou! (いえでまなぼう！)**
  - [https://applepedlar.github.io/iemana/](https://applepedlar.github.io/iemana/)

## クレジット

本アプリケーションは、[Taisuke Fukuno (福野泰介)](https://fukuno.jig.jp/) によって作成されました。

## ライセンス

本プロジェクトは MIT License の下でライセンスされています。
