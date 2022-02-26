/* ===============================================
 * gulpfile.jsとpackage.jsonのみコピーし「npm install」
    とするだけで必要なプラグインをまとめてインストール
=============================================== */
/*
gulp.〇〇は定数で呼び出してまとめる
src 参照元を指定
dest 出力さきを指定
watch ファイル監視
lastRun 更新ファイルを次の処理に渡す
series(直列処理)とparallel(並列処理)
*/
const { src, dest, watch, lastRun, series, parallel } = require("gulp");

// htmlプラグイン
const htmlMin = require("gulp-htmlmin");

// Sassプラグイン
const sass = require("gulp-dart-sass");
const notify = require("gulp-notify"); // エラー発生時のアラート
const plumber = require("gulp-plumber"); // エラーで終了させない
const postCss = require("gulp-postcss"); // autoprefix利用用
const autoprefixer = require("autoprefixer") // atoprefix読み込み
const gcmq = require("gulp-group-css-media-queries"); // 別の場所の同じ内容のmqをまとめる

//画像圧縮プラグイン
//JS圧縮プラグイン

// ブラウザ同期プラグイン
const browserSync = require("browser-sync").create();

// 参照元・出力先パス定義(連想配列)
const paths = {
  html: {
    src: "./src/*html",
    dist: "dist/",
  },
  styles: {
    src: "./src/scss/**/*.scss",
    dist: "./dist/css/",
    map: "./map",
  },
  // images: {

  // }
};

// htmlフォーマット
const htmlFormat = () => {
  return src(paths.html.src)
    .pipe(
      plumber({
        // エラーがあっても処理を止めない
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(
      htmlMin({
        // html圧縮
        removeComments: true, // コメントの削除
        collapseWhitespace: true, // 余白を埋める
        preserveLineBreaks: true, // タグ間の改行を詰める
        removeEmptyAttributes: false // 空属性を削除しない
      })
    )
    .pipe(dest(paths.html.dist));
};

// Sassコンパイル
const sassCompile = () => {
  //コンパイル元(連想配列のキーを取得)
  return src(paths.styles.src, {
    sourcemaps: true, // mapファイル作成
  })
    .pipe(
      // 並列処理
      plumber({
        // エラーがあっても処理を止めない
        errorHandler: notify.onError("Error:<%= error.message %>"),
      })
    )
    .pipe(
      sass({
        //CSSの吐き出し方法
        outputStyle: "expanded",
      }).on("error", sass.logError) // エラー出力
    )
    .pipe(
      postCss([
        autoprefixer({
          // プロパティのインデントを整形しない
          cascade: false,
        }),
      ])
    )
    // メディアクエリをまとめる
    .pipe(gcmq())
    .pipe(
      //コンパイル先 dest = destination(到達点)
      dest(paths.styles.dist, {
        sourcemaps: "./map",
      })
    )
    // 変更があったらリロードせずCSSのみ更新
    .pipe(browserSync.stream())
};

// ローカルサーバー起動
const browserSyncFunc = (done) => {
  browserSync.init({
    // デフォルトのconnectedのメッセージ非表示
    notify: false,
    server: {
      baseDir: "./",
    },
    startPath: "./dist/index.html",
    reloadOnRestart: true,
  });
  done();
}

// ブラウザリロード
const browserReloadFunc = (done) => {
  browserSync.reload();
  done();
}

// ファイル監視
const watchFiles = () => {
  watch(paths.html.src, series(htmlFormat, browserReloadFunc));
  watch(paths.styles.src, series(sassCompile));
}

// npx gulpでタスク実行
exports.default = series(
  parallel(htmlFormat, sassCompile),  
  parallel(watchFiles, browserSyncFunc)  
);