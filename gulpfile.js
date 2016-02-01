var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var minifyCss   = require('gulp-minify-css');
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
var htmlmin     = require('gulp-htmlmin');
var copy2       = require('gulp-copy2');
var del         = require('del');
var plumber     = require('gulp-plumber');
var notify      = require("gulp-notify");
var jshint      = require('gulp-jshint');
var stylish     = require('jshint-stylish');
var imagemin    = require('gulp-imagemin');
var ghPages     = require('gulp-gh-pages');
var sourcemaps  = require('gulp-sourcemaps');

var messages = {
    jekyllBuild: '<span style="color: green">Running:</span> $ jekyll build'
};

var app = {
  base:   'app',
  sass:   'app/_scss/main.sass',
  css:    'app/assets/css',
  js:     'app/_script/**/*.js',
  jsa:    'app/assets/js'
};

var site = {
  base:   '_site',
  css:    '_site/assets/css',
  html:   '_site/**/*.html',
  cssAll: '_site/assets/css/**/*.css',
  img:    '_site/assets/img/**/*',
  jsAll:  '_site/assets/js/**/*.js'
};

var dist = {
  all:    'dist/**',
  dist:   'dist',
  css:    'dist/assets/css/',
  img:    'dist/assets/img/',
  js:     'dist/assets/js/'
};

var watch = {
  sass:   'app/_scss/**/*.sass',
  js:     'app/_script/**/*.js',
  html:   'app/**/*.html',
  post:   'app/_posts/*',
  data:   'app/_data/*'
};

//--------------------------------------------------------------------------------------------------------
// Build the Jekyll Site
//--------------------------------------------------------------------------------------------------------

gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
        .on('close', done);
});


//--------------------------------------------------------------------------------------------------------
// Rebuild Jekyll & do page reload
//--------------------------------------------------------------------------------------------------------

gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});


//--------------------------------------------------------------------------------------------------------
// Wait for jekyll-build, then launch the Server
//--------------------------------------------------------------------------------------------------------

gulp.task('browser-sync', ['sass', 'js', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: site.base
        }
    });
});



//--------------------------------------------------------------------------------------------------------
// Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
//--------------------------------------------------------------------------------------------------------

gulp.task('sass', function () {
    return gulp.src(app.sass)
      .pipe(sourcemaps.init())
        .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
        .pipe(sass({ includePaths: ['scss'], indentedSyntax: true, onError: browserSync.notify }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest(site.css))
        .pipe(browserSync.reload({stream:true}))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(app.css));
});


//--------------------------------------------------------------------------------------------------------
// Concat and uglify files from _script into assets/js
//--------------------------------------------------------------------------------------------------------

gulp.task('js', function () {
  return gulp.src(app.js)
    .pipe(sourcemaps.init())
      .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(concat('main.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(app.jsa));
});


//--------------------------------------------------------------------------------------------------------
// Rmove old dist dir
//--------------------------------------------------------------------------------------------------------

gulp.task('clean', ['jekyll-build', 'js', 'sass'], function (cb) {
  return del([dist.all], cb);
});


//--------------------------------------------------------------------------------------------------------
// Minify html and copy them into the dist dir
//--------------------------------------------------------------------------------------------------------

gulp.task('htmlmin', ['clean'], function () {
  return gulp.src(site.html)
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(dist.dist));
});


//--------------------------------------------------------------------------------------------------------
// Minify css and copy them into the dist dir
//--------------------------------------------------------------------------------------------------------

gulp.task('cssmin', ['htmlmin'], function () {
  return gulp.src(site.cssAll)
    .pipe(minifyCss())
    .pipe(gulp.dest(dist.css));
});


//--------------------------------------------------------------------------------------------------------
// copy images and minify them into the dist dir
//--------------------------------------------------------------------------------------------------------

gulp.task('imgmin', ['cssmin'], function () {
  return gulp.src(site.img)
    .pipe(imagemin({ progressive: true }))
    .pipe(gulp.dest(dist.img));
});


//--------------------------------------------------------------------------------------------------------
// copy css and js form _site dir into the dist dir
//--------------------------------------------------------------------------------------------------------

gulp.task('uglifyjs', ['imgmin'], function () {
  return gulp.src(site.jsAll)
    .pipe(uglify())
    .pipe(gulp.dest(dist.js));
});


//--------------------------------------------------------------------------------------------------------
// copy files form _site dir into the dist dir
//--------------------------------------------------------------------------------------------------------

gulp.task('copy', ['uglifyjs'], function () {
  var paths = [
    //{src: '_site/assets/js/*', dest: 'dist/assets/js/'}
  ];
  return copy2(paths);
});


//--------------------------------------------------------------------------------------------------------
// build site into dist dir
//--------------------------------------------------------------------------------------------------------

gulp.task('build', ['copy'], function () {
  return gulp.src("_site/")
    .pipe(notify("Gulp Build Completed!"));
});


//--------------------------------------------------------------------------------------------------------
// deploy site to github pages
//--------------------------------------------------------------------------------------------------------

gulp.task('deploy', ['build'], function () {
  return gulp.src('dist/**/*')
    .pipe(ghPages());
});


//--------------------------------------------------------------------------------------------------------
// Watch scss files for changes & recompile
// Watch html/md files, run jekyll & reload BrowserSync
//--------------------------------------------------------------------------------------------------------

gulp.task('watch', function () {
    gulp.watch(watch.sass, ['sass']);
    gulp.watch(watch.js, ['js', 'jekyll-rebuild']);
    gulp.watch([watch.html, watch.post, watch.data], ['jekyll-rebuild']);
});


//--------------------------------------------------------------------------------------------------------
// Default task, running just `gulp serve` will compile the sass,
// compile the jekyll site, launch BrowserSync & watch files.
//--------------------------------------------------------------------------------------------------------

gulp.task('default', ['build']);
gulp.task('serve', ['browser-sync', 'watch']);
