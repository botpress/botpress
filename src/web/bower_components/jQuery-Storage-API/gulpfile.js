var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename');

// Compress task
gulp.task('compress', function () {
    return gulp.src('./jquery.storageapi.js')
        .pipe(uglify({
            preserveComments: function (win, doc) {
                return /Licensed under/.test(doc.value);
            }
        }))
        .pipe(rename('jquery.storageapi.min.js'))
        .pipe(gulp.dest('./'));
});