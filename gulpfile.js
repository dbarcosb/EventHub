const gulp = require('gulp');
const sass = require('gulp-sass');
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const rev = require('gulp-rev');
const revdel = require('gulp-rev-delete-original');
const collect = require('gulp-rev-collector');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const del = require('del');
const runSequence = require('run-sequence');
// var gulpIf = require('gulp-if');


// Start browserSync server
gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: 'app'
        }
    })
})

// SASS task for CSS
gulp.task('sass', function () {
    return gulp.src('app/scss/**/*.scss') // Gets all files ending with .scss in app/scss and children dirs
        .pipe(sass().on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(gulp.dest('app/css')) // Outputs it in the css folder
        .pipe(browserSync.reload({ // Reloading with Browser Sync
            stream: true
        }));
})

// Watchers
gulp.task('watch', function () {
    // Runs sass task whenever SCSS files change
    gulp.watch('app/scss/**/*.scss', ['sass']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('app/*.html', browserSync.reload);
    gulp.watch('app/js/**/*.js', browserSync.reload);
    // Other watchers
})

// CSS Minification + Sourcemap
// If concatenation needed, add it before minification
gulp.task('minifyCSS', function () {
    return gulp.src('app/css/**/*.css')
        .pipe(sourcemaps.init())
        .pipe(cssnano())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/css'))
});

// JS Minification + Sourcemap
// If concatenation needed, add it before minification
gulp.task('minifyJS', function () {
    return gulp.src('app/js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js'))
});

// HTML Minification
gulp.task('minifyHTML', function () {
    return gulp.src('app/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('dist'));
});

// Images optimization
gulp.task('images', function () {
    return gulp.src('app/img/**/*.+(png|jpg|jpeg|gif|svg)')
        // Caching images that ran through imagemin
        .pipe(cache(imagemin({
            interlaced: true
        })))
        .pipe(gulp.dest('dist/img'))
});

// Rename  static minified files
gulp.task('ver-append', function () {
    return gulp.src(['dist/**/*.html',
            'dist/**/*.css',
            'dist/**/*.js',
            'dist/**/*.{png,jpg,jpeg,gif,svg}'
        ])
        .pipe(rev())
        .pipe(revdel())
        .pipe(gulp.dest('dist'))
        .pipe(rev.manifest('manifest.json'))
        .pipe(gulp.dest('dist'))
});
// Rename them inside the files (update references)
gulp.task('updateHTML', function () {
    return gulp.src(['dist/manifest.json', 'dist/**/*.{html, json, css, js}'])
        .pipe(collect())
        .pipe(gulp.dest('dist'))
});

// Just copying fonts to dist
gulp.task('fonts', function () {
    return gulp.src('app/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'))
})

// Cleaning up
gulp.task('clean', function () {
    return del.sync('dist').then(function (cb) {
        return cache.clearAll(cb);
    });
})
gulp.task('clean:dist', function () {
    return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

// Combining all gulp tasks
// Creates a dist folder for the production site
gulp.task('build', function (callback) {
    runSequence(
        'clean:dist',
        'sass',
        ['minifyCSS', 'minifyJS', 'minifyHTML', 'images'],
        'ver-append',
        'updateHTML',
        callback
    )
})
// Compiles Sass into CSS while watching HTML and JS files for changes
gulp.task('default', function (callback) {
    runSequence(['sass', 'browserSync'], 'watch',
        callback
    )
})

// Resources
// https://css-tricks.com/gulp-for-beginners/
// Web Tooling & Automation Udacity Course
// https://medium.com/@felipebernardes/solving-browser-cache-hell-with-gulp-rev-6349a293abb9