var gulp = require('gulp'),
  jade = require('gulp-jade'),
  connect = require('gulp-connect'),
  plumber = require('gulp-plumber'),
  watch = require('gulp-watch'),
  less = require('gulp-less'),
  sass = require('gulp-sass'),
  clean = require('gulp-clean'),
  concat = require('gulp-concat'),
  prefix = require('gulp-autoprefixer'),
  pkg = require('./package.json'),
  config = require('./whirl-config.json'),
  processSrc = [],
  env = 'dist/',
  sources = {
    docs: "src/jade/index.jade",
    templates: "src/jade/**/*.jade",
    less: "src/less/**/*.less",
    scss: "src/scss/**/*.scss",
    buildCss: env + "**/*.css",
    coreLess: "src/less/core.less",
    coreScss: "src/scss/core.scss"
  },
  destinations = {
    build: env,
    overwatch: env + "**/*.*"
  },
  gatherSrc = function (sources, path, ext) {
    for (var source in sources ) {
      if (typeof(sources[source]) === 'object' && Object.keys(sources[source]).length > 0) {
        var newPath = (path === undefined) ? source + '/' :path + source + '/';
        gatherSrc(sources[source], newPath, ext);
      } else if (sources[source] === true) {
        processSrc.push('src/' + ext + '/whirls/' + path + source + '.' + ext);
      }
    }
  };
/***DEV TASKS***/
gulp.task('dev', ["cleanup", "serve", "jade:build", "jade:watch", "less:build", "less:watch"]);
/*SERVER*/
gulp.task('serve', function(event) {
  connect.server({
    root: destinations.build,
    port: 1987,
    livereload: true
  });
  watch({glob: destinations.overwatch})
    .pipe(connect.reload());
});
/*BUILD JADE*/
gulp.task('jade:build', function(event) {
  return gulp.src(sources.docs)
    .pipe(plumber())
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest(destinations.build));
});
/*WATCH JADE*/
gulp.task('jade:watch', function(event) {
  gulp.watch(sources.docs, ["jade:build"]);
});
/*WATCH LESS*/
gulp.task('less:watch', function(event) {
  watch({glob: sources.less}, function(files) {
    return gulp.src(sources.less)
      .pipe(plumber())
      .pipe(concat(pkg.name + '.less'))
      .pipe(less())
      .pipe(prefix(['last 3 versions', 'Blackberry 10', 'Android 3', 'Android 4']))
      .pipe(gulp.dest(destinations.build));
  });
});
/*WATCH SCSS*/
gulp.task('scss:watch', function(event) {
  watch({glob: sources.scss}, function(files) {
    return gulp.src(sources.scss)
      .pipe(plumber())
      .pipe(concat(pkg.name + '.scss'))
      .pipe(sass())
      .pipe(prefix(['last 3 versions', 'Blackberry 10', 'Android 3', 'Android 4']))
      .pipe(gulp.dest(destinations.build));
  });
});
/***/
/*CLEANUP*/
gulp.task('cleanup', function(event) {
  return gulp.src(destinations.build)
    .pipe(clean());
});
gulp.task('release', function(event) {
  return gulp.src([sources.buildCss])
    .pipe(gulp.dest(''));
});
/*RELEASE BUILD*/
gulp.task('release:build', ["less:build", "release"]);
/*BUILD LESS*/
gulp.task('less:build', function(event) {
  processSrc = [sources.coreLess];
  gatherSrc(config.spins, undefined, 'less');
  return gulp.src(processSrc)
    .pipe(plumber())
    .pipe(concat(pkg.name + '.less'))
    .pipe(less())
    .pipe(prefix(['last 3 versions', 'Blackberry 10', 'Android 3', 'Android 4']))
    .pipe(gulp.dest(destinations.build))
    .pipe(concat(pkg.name + '.min.less'))
    .pipe(less({
      compress: true
    }))
    .pipe(gulp.dest(destinations.build));
});
gulp.task('scss:build', function(event) {
  processSrc = [sources.coreScss];
  gatherSrc(config.spins, undefined, 'scss');
  return gulp.src(processSrc)
    .pipe(plumber())
    .pipe(concat(pkg.name + '.scss'))
    .pipe(sass())
    .pipe(prefix(['last 3 versions', 'Blackberry 10', 'Android 3', 'Android 4']))
    .pipe(gulp.dest(destinations.build))
    .pipe(concat(pkg.name + '.min.scss'))
    .pipe(sass({
      style: "compressed"
    }))
    .pipe(gulp.dest(destinations.build));
});
/*DEFAULT TASK*/
gulp.task('default', ["cleanup", "less:build"]);
