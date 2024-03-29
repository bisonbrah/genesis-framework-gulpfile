//process.env.DISABLE_NOTIFIER = true; // Disable all notifications.

// Require our dependencies.
var autoprefixer = require('autoprefixer'),
    browsersync = require('browser-sync'),
    mqpacker = require('css-mqpacker'),
    gulp = require('gulp'),
    bump = require('gulp-bump'),
    beautify = require('gulp-cssbeautify'),
    cache = require('gulp-cached'),
    cleancss = require('gulp-clean-css'),
    cssnano = require('gulp-cssnano'),
    filter = require('gulp-filter'),
    imagemin = require('gulp-imagemin'),
    notify = require('gulp-notify'),
    pixrem = require('gulp-pixrem'),
    plumber = require('gulp-plumber'),
    postcss = require('gulp-postcss'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    sass = require('gulp-sass'),
    sort = require('gulp-sort'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    wpPot = require('gulp-wp-pot'),
    zip = require('gulp-zip'),
    mysqlDump = require('mysqldump'),
    svgSprite = require("gulp-svg-sprites");

// Set assets paths.
var paths = {
    concat: ['assets/scripts/menus.js', 'assets/scripts/superfish.js'],
    images: ['assets/images/*', '!assets/images/*.svg'],
    php: ['./*.php', './**/*.php', './**/**/*.php'],
    scripts: ['assets/scripts/*.js', '!assets/scripts/min/'],
    styles: ['assets/styles/*.scss', '!assets/styles/min/'],
    sprites: ['assets/images/*.svg', '!assets/sprites/*.svg']
};

// CSS formatting.
var format = {
    breaks: {
        afterAtRule: true,
        afterBlockBegins: true,
        afterBlockEnds: true,
        afterComment: true,
        afterProperty: true,
        afterRuleBegins: true,
        afterRuleEnds: true,
        beforeBlockEnds: true,
        betweenSelectors: true
    },
    indentBy: 1,
    indentWith: 'tab',
    spaces: {
        aroundSelectorRelation: true,
        beforeBlockBegins: true,
        beforeValue: true
    },
    wrapAt: false
}

/**
 * Autoprefixed browser support.
 *
 * https://github.com/ai/browserslist
 */
const AUTOPREFIXER_BROWSERS = [
    'last 2 versions',
    '> 0.25%',
    'ie >= 8',
    'ie_mob >= 9',
    'ff >= 28',
    'chrome >= 40',
    'safari >= 6',
    'opera >= 22',
    'ios >= 6',
    'android >= 4',
    'bb >= 9'
];

/**
 * Compile Sass.
 *
 * https://www.npmjs.com/package/gulp-sass
 */
gulp.task('styles', function () {

    gulp.src(paths.styles)

        // Notify on error
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))

        // Source maps init
        .pipe(sourcemaps.init())

        // Process sass
        .pipe(sass({
            outputStyle: 'expanded'
        }))

        // Pixel fallbacks for rem units.
        .pipe(pixrem())

        // Parse with PostCSS plugins.
        .pipe(postcss([
            autoprefixer({
                browsers: AUTOPREFIXER_BROWSERS
            }),
            mqpacker({
                sort: true
            }),
        ]))

        // Format non-minified stylesheet.
        .pipe(cleancss({format: format}))

        // Output non minified css to theme directory.
        .pipe(gulp.dest('./'))

        // Process sass again.
        .pipe(sass({
            outputStyle: 'compressed'
        }))

        // Combine similar rules.
        .pipe(cleancss({
            level: {
                2: {
                    all: true
                }
            }
        }))

        // Minify and optimize style.css again.
        .pipe(cssnano({
            safe: false,
            discardComments: {
                removeAll: true,
            },
        }))

        // Add .min suffix.
        .pipe(rename({suffix: '.min'}))

        // Write source map.
        .pipe(sourcemaps.write('./'))

        // Output the compiled sass to this directory.
        .pipe(gulp.dest('assets/styles/min'))

        // Filtering stream to only css files.
        .pipe(filter('**/*.css'))

        // Inject changes via browsersync.
        .pipe(browsersync.reload({stream: true}))

        // Notify on successful compile (uncomment for notifications).
        .pipe(notify("Compiled: <%= file.relative %>"));

});

/**
 * Minify javascript files.
 *
 * https://www.npmjs.com/package/gulp-uglify
 */
gulp.task('scripts', function () {

    gulp.src(paths.scripts)

        // Notify on error.
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))

        // Cache files to avoid processing files that haven't changed.
        .pipe(cache('scripts'))

        // Add .min suffix.
        .pipe(rename({suffix: '.min'}))

        // Minify.
        .pipe(uglify())

        // Output the processed js to this directory.
        .pipe(gulp.dest('assets/scripts/min'))

        // Inject changes via browsersync.
        .pipe(browsersync.reload({stream: true}))

        // Notify on successful compile.
        .pipe(notify("Minified: <%= file.relative %>"));

});

/**
 * Optimize images.
 *
 * https://www.npmjs.com/package/gulp-imagemin
 */
gulp.task('images', function () {

    return gulp.src(paths.images)

        // Notify on error.
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))

        // Cache files to avoid processing files that haven't changed.
        .pipe(cache('images'))

        // Optimize images.
        .pipe(imagemin({
            progressive: true
        }))

        // Output the optimized images to this directory.
        .pipe(gulp.dest('assets/images'))

        // Inject changes via browsersync.
        .pipe(browsersync.reload({stream: true}))

        // Notify on successful compile.
        .pipe(notify("Optimized: <%= file.relative %>"));

});

/**
 * Generate SVG Sprite
 *
 * https://www.npmjs.com/package/gulp-svg-sprites
 */
gulp.task('sprites', function () {

    return gulp.src(paths.sprites)

        // Notify on error.
        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))

        // Cache files to avoid processing files that haven't changed.
        .pipe(cache('images'))

        // Required
        .pipe(svgSprite())

        // Output sprite in destination folder.
        .pipe(gulp.dest("assets/svgs"))

        // Inject changes via browsersync.
        .pipe(browsersync.reload({stream: true}))

        // Notify on successful compile.
        .pipe(notify("Optimized: <%= file.relative %>"));

});

/**
 * Scan the theme and create a POT file.
 *
 * https://www.npmjs.com/package/gulp-wp-pot
 */
gulp.task('i18n', function () {

    return gulp.src(paths.php)

        .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))

        .pipe(sort())

        .pipe(wpPot({
            domain: 'custom',
            destFile: 'languages.pot',
            package: 'Custom Theme',
            bugReport: 'https://evanghenry.com/support',
            lastTranslator: 'Evan Henry <evan@bisontechllc.com.com>',
            team: 'BisonTech LLC <webmaster@bisontechllc.com>'
        }))

        .pipe(gulp.dest('./'));

});

/**
 * Manually bumps version.
 *
 * https://www.npmjs.com/package/gulp-bump
 */
gulp.task('bump', function () {

    var oldversion = '2.0.0';
    var newversion = '2.0.2';

    gulp.src(['./package.json', './style.css'])
        .pipe(bump({version: newversion}))
        .pipe(gulp.dest('./'));

    gulp.src(['./gulpfile.js'])
        .pipe(replace("oldversion = " + oldversion + ";", "oldversion = " + newversion + ";"))
        .pipe(gulp.dest('./'));

    gulp.src(['./functions.php'])
        .pipe(replace("'CHILD_THEME_VERSION', '" + oldversion, "'CHILD_THEME_VERSION', '" + newversion))
        .pipe(gulp.dest('./'));

    gulp.src('./assets/styles/style.scss')
        .pipe(bump({version: newversion}))
        .pipe(gulp.dest('./assets/styles/'));

});

/**
 * Package theme.
 *
 * https://www.npmjs.com/package/gulp-zip
 */
gulp.task('zip', function () {

    gulp.src(['./**/*', '!./node_modules/', '!./node_modules/**'])
        .pipe(zip(__dirname.split("/").pop() + '.zip'))
        .pipe(gulp.dest('../'));

});

/**
 * Generate mySQL dump for backup
 *
 * https://www.npmjs.com/package/mysqldump
 */
gulp.task('sql-dump', function () {

    mysqlDump({
        host: '192.168.95.100', // local by Flywheel host IP
        user: 'root', // local by Flywheel default
        password: 'root', // local by Flywheel default
        database: 'local', // local by Flywheel default
        port: '4042', // local by Flywheel db port
        dest: './data.sql' // destination file
    }, function (err) {
        // create data.sql file;
    });

});

/**
 * Process tasks and reload browsers on file changes.
 *
 * https://www.npmjs.com/package/browser-sync
 */
gulp.task('watch', function () {

    // Kick off Browsersync.
    browsersync({
        proxy: 'genesis-starter.dev', // Add local dev URL here for browsersync function
        notify: false,
        open: false
    });

    // Run tasks when files change.
    gulp.watch(paths.styles, ['styles']);
    gulp.watch(paths.scripts, ['scripts']);
    gulp.watch(paths.images, ['images']);
    gulp.watch(paths.sprites, ['sprites']);
    gulp.watch(paths.php).on('change', browsersync.reload);

});

/**
 * Create default task.
 */
gulp.task('default', ['watch'], function () {
    gulp.start('styles', 'scripts', 'images', 'sprites');
});
