var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var minifyCss   = require('gulp-minify-css');
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
var jade        = require('gulp-jade');
var htmlmin     = require('gulp-htmlmin');
var copy2       = require('gulp-copy2');
var del         = require('del');
var plumber     = require('gulp-plumber');
var notify      = require("gulp-notify");

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'js', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('_scss/main.scss')
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(minifyCss())
        .pipe(gulp.dest('_site/assets/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('assets/css'));
});

/**
 * Concat and uglify files from _script into assets/js
 */

gulp.task('js', function () {
  return gulp.src('_script/**/*.js')
    .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest('assets/js'));
});

 /**
  * Jade files from _jade into _includes
  */

gulp.task('jadetem', function () {
  return gulp.src('_jade/**/*.jade')
    .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
    .pipe(jade())
    .pipe(gulp.dest('./'));
});

/**
 * Rmove old dist dir
 */

gulp.task('clean', function (cb) {
  return del(['dist/**'], cb);
});

/**
 * Minify html and copy them into the dist dir
 */

gulp.task('htmlmin', ['clean'], function () {
  return gulp.src('_site/**/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

/**
 * copy assets dir into the dist dir
 */

gulp.task('copy', ['htmlmin'], function () {
  var paths = [
    {src: '_site/assets/**', dest: 'dist/assets/'},
  ];
  return copy2(paths);
});

/**
 * build site into dist dir
 */

gulp.task('build', ['copy']);


/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('_scss/*.scss', ['sass']);
    gulp.watch('_script/**/*.js', ['js', 'jekyll-rebuild']);
    gulp.watch('_jade/**/*.jade', ['jadetem']);
    gulp.watch(['index.html', '_layouts/*.html', '_posts/*', '_includes/**/*.html'], ['jekyll-rebuild']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);
