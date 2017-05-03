const gulp = require('gulp');
const babel = require('gulp-babel');
const autoreload = require('autoreload-gulp');


const sources = {
	babel: ['app.js', 'src/**/*.js']
}


function handleError(err) {
	console.log(err.toString());
	console.log(err.stack);
	this.emit('end');
}


gulp.task('babel', () => {
	return gulp.src(sources.babel)
	.pipe(babel({
		presets: ['latest'],
		//plugins: ['transform-es2015-modules-commonjs', 'transform-async-to-generator']
	}))
	.on('error', handleError)
	.pipe(gulp.dest('dist'));
});


gulp.task('build', ['babel']);

gulp.task('watch', () => {
  gulp.watch(sources.babel, ['babel']);
})

gulp.task('reload', autoreload('watch'));

gulp.task('default', ['build']);


