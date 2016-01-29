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
    return gulp.src('app/_scss/main.sass')
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(sass({
            includePaths: ['scss'],
            indentedSyntax: true,
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('_site/assets/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('app/assets/css'));
});

/**
 * Concat and uglify files from _script into assets/js
 */

gulp.task('js', function () {
  return gulp.src('app/_script/**/*.js')
    .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('app/assets/js'));
});

/**
 * Rmove old dist dir
 */

gulp.task('clean', ['jekyll-build', 'js', 'sass'], function (cb) {
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
 * Minify css and copy them into the dist dir
 */

gulp.task('cssmin', ['htmlmin'], function () {
  return gulp.src('_site/assets/css/**/*.css')
    .pipe(minifyCss())
    .pipe(gulp.dest('dist/assets/css/'));
});

/**
 * copy images and minify them into the dist dir
 */

gulp.task('imgmin', ['cssmin'], function () {
  return gulp.src('_site/assets/img/**/*')
    .pipe(imagemin({ progressive: true }))
    .pipe(gulp.dest('dist/assets/img/'));
});

/**
 * copy css and js form _site dir into the dist dir
 */

gulp.task('uglifyjs', ['imgmin'], function () {
  return gulp.src('_site/assets/js/**/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js/'));
});

gulp.task('copy', ['uglifyjs'], function () {
  var paths = [
    //{src: '_site/assets/js/*', dest: 'dist/assets/js/'}
  ];
  return copy2(paths);
});

/**
 * build site into dist dir
 */

gulp.task('build', ['copy'], function () {
  return gulp.src("_site/")
    .pipe(notify("Gulp Build Completed!"));
});


gulp.task('deploy', ['build'], function () {
  return gulp.src('dist/**/*')
    .pipe(ghPages());
});


/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('app/_scss/**/*.sass', ['sass']);
    gulp.watch('app/_script/**/*.js', ['js', 'jekyll-rebuild']);
    gulp.watch(['app/**/*.html', 'app/_posts/*', 'app/_data/*'], ['jekyll-rebuild']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['build']);

gulp.task('serve', ['browser-sync', 'watch']);
