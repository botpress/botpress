var args = require('yargs').argv,
    path = require('path'),
    fs = require('fs'),
    del = require('del'),
    gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    webpackStream = require('webpack-stream'),
    gulpsync = $.sync(gulp),
    webpack = require('webpack');

module.exports = ({ landingPagePath, modules, skipLogs }) => {

    function done() {
        this.emit('done')
    }

    function handleError(err) {
        this.emit('err', err)
        console.log(err.toString())
        this.emit('end')
    }

    function log(msg) {
        if (!skipLogs) {
            $.util.log($.util.colors.blue(msg))
        } else {
            $.util.log = function() {}
        }
    }

    var isProduction = !!args.prod

    if (isProduction) {
        log('Starting production build...')
    }

    var useSourceMaps = !isProduction

    var hidden_files = '**/_*.*'
    var ignored_files = '!' + hidden_files

    var paths = {
        app: __dirname + '/master/',
        dist: __dirname + '/dist/',
        modules: __dirname + '/modules/',
        landing: __dirname + '/landing/',
        styles: 'sass/',
        scripts: 'jsx/'
    }

    var vendor = {
        source: './vendor.json',
        dist: paths.dist + 'vendor',
        bundle: {
            js: 'vendor.bundle.js',
            css: 'vendor.bundle.css'
        }
    }

    var source = {
        scripts: {
            app: [paths.app + paths.scripts + '**/*.{jsx,js}'],
            entry: [paths.app + paths.scripts + 'App.jsx']
        },
        templates: {
            index: paths.app + 'index.html'
        },
        styles: {
            app: [paths.app + paths.styles + '*.*'],
            themes: [paths.app + paths.styles + 'themes/*', ignored_files],
            watch: [paths.app + paths.styles + '**/*', '!' + paths.app + paths.styles + 'themes/*']
        },
        images: [paths.app + 'img/**/*'],
        fonts: [
            paths.app + 'fonts/*.{ttf,woff,woff2,eof,svg}'
        ],
        serverAssets: [paths.app + 'server/**/*']
    }

    var build = {
        scripts: paths.dist + 'js',
        styles: paths.dist + 'css',
        images: paths.dist + 'img',
        fonts: paths.dist + 'fonts',
        serverAssets: paths.dist + 'server'
    }

    var vendorUglifyOpts = {
        mangle: {
            except: ['$super'] // rickshaw requires this
        }
    }

    var cssnanoOpts = {
        safe: true,
        discardUnused: false,
        reduceIdents: false
    }

    var webpackConfig = require(
        isProduction ?
        './app.webpack.config.prod' :
        './app.webpack.config.dev'
    )

    var bundler = webpack(webpackConfig)

    gulp.task('scripts:app', ['landing', 'modules'] , function() {
        log('Building scripts..')
            // Minify and copy all JavaScript (except vendor scripts)
        return gulp.src(source.scripts.entry)
            .pipe($.if(useSourceMaps, $.sourcemaps.init()))
            .pipe(webpackStream(webpackConfig))
            .on("error", handleError)
            .pipe($.if(isProduction, $.uglify({
                preserveComments: 'some'
            })))
            .on("error", handleError)
            .pipe($.if(useSourceMaps, $.sourcemaps.write()))
            .pipe(gulp.dest(build.scripts))
    })

    gulp.task('vendor', function() {
        log('Copying vendor assets..')

        var jsFilter = $.filter('**/*.js', {
            restore: true
        })
        var cssFilter = $.filter('**/*.css', {
            restore: true
        })
        var imgFilter = $.filter('**/*.{png,jpg}', {
            restore: true
        })
        var fontsFilter = $.filter('**/*.{ttf,woff,woff2,eof,svg}', {
            restore: true
        })

        var vendorSrc = JSON.parse(fs.readFileSync(vendor.source, 'utf8'))

        return gulp.src(vendorSrc, {
                base: 'bower_components'
            })
            .pipe($.expectFile({
                silent: true
            }, vendorSrc))
            .pipe(jsFilter)
            .pipe($.if(isProduction, $.uglify(vendorUglifyOpts)))
            .pipe($.concat(vendor.bundle.js))
            .pipe(gulp.dest(build.scripts))
            .pipe(jsFilter.restore)
            .pipe(cssFilter)
            .pipe($.if(isProduction, $.cssnano(cssnanoOpts)))
            .pipe($.concat(vendor.bundle.css))
            .pipe(gulp.dest(build.styles))
            .pipe(cssFilter.restore)
            .pipe(imgFilter)
            .pipe($.flatten())
            .pipe(gulp.dest(build.images))
            .pipe(imgFilter.restore)
            .pipe(fontsFilter)
            .pipe($.flatten())
            .pipe(gulp.dest(build.fonts))
            .pipe(fontsFilter.restore)
    })

    const moduleTasks = modules.map((mod) => {
      const taskName = 'module:' + mod.name
      gulp.task(taskName, function() {
        return gulp.src(mod.path)
          .pipe(gulp.dest(paths.modules + '/' + mod.name))
      })
      return taskName
    })

    gulp.task('modules', gulpsync.sync(moduleTasks))

    gulp.task('landing', function() {
      return gulp.src(landingPagePath)
        .pipe(gulp.dest(paths.landing))
    })

    gulp.task('styles:app', function() {
        log('Building application styles..')
        return gulp.src(source.styles.app)
            .pipe($.if(useSourceMaps, $.sourcemaps.init()))
            .pipe($.sass())
            .on("error", handleError)
            .pipe($.if(isProduction, $.cssnano(cssnanoOpts)))
            .pipe($.if(useSourceMaps, $.sourcemaps.write()))
            .pipe(gulp.dest(build.styles))
    })

    gulp.task('styles:themes', function() {
        log('Building application theme styles..')
        return gulp.src(source.styles.themes)
            .pipe($.sass())
            .on("error", handleError)
            .pipe(gulp.dest(build.styles))
    })

    gulp.task('fonts', function() {
        return gulp.src(source.fonts)
            .pipe($.flatten())
            .pipe(gulp.dest(build.fonts))
    })

    gulp.task('images', function() {
        return gulp.src(source.images)
            .pipe(gulp.dest(build.images))
    })

    gulp.task('server-assets', function() {
        return gulp.src(source.serverAssets)
            .pipe(gulp.dest(build.serverAssets))
    })

    gulp.task('templates:index', function() {
        return gulp.src(source.templates.index)
            .pipe(gulp.dest(paths.dist))
    })

    gulp.task('watch', function() {
        log('Watching source files..')

        gulp.watch(source.scripts.app, ['scripts:app'])
        gulp.watch(source.styles.themes, ['styles:themes'])
        gulp.watch(source.templates.index, ['templates:index'])
        gulp.watch(vendor.source, ['vendor'])

        for(var mod of modules) {
          gulp.watch(mod.path, ['modules', 'scripts:app'])
        }

        gulp.watch(landingPagePath, ['landing', 'scripts:app'])
    })

    //---------------
    // MAIN TASKS
    //---------------

    gulp.task('build', gulpsync.sync([
        'vendor',
        'assets'
    ]))

    gulp.task('default', gulpsync.sync([
        'vendor',
        'assets',
        'watch'
    ]), done)

    gulp.task('assets', [
        'landing',
        'modules',
        'fonts',
        'images',
        'server-assets',
        'scripts:app',
        'styles:app',
        'styles:themes',
        'templates:index'
    ])

    gulp.task('clean', function(done) {
        log('Clean dist folder..')
        del(paths.dist, { force: true })
        .then(function() {
          del(paths.modules, { force: true })
        })
        .then (function() {
          del(paths.landing, { force: true })
        })
        .then (function() {
          done()
        })
    })

    return gulp;
}
