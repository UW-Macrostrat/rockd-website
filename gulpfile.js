var gulp = require('gulp')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var gutil = require('gulp-util')
var babelify = require('babelify')
var buffer = require('gulp-buffer')
var uglify = require('gulp-uglify')
var minifyCSS = require('gulp-minify-css')
var concat = require('gulp-concat')

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
	'react',
  'react-dom'
]
// keep a count of the times a task refires
var scriptsCount = 0

// Gulp tasks
// ----------------------------------------------------------------------------
gulp.task('scripts', function () {
    bundleApp(false)
})

gulp.task('deploy', function (){
	bundleApp(true)
})

gulp.task('watch', function () {
	gulp.watch(['./src/js/*/*.js', './src/js/*.js'], ['scripts'])
	gulp.watch(['./src/css/*.css'], ['css'])
})

gulp.task('css', function() {
  gulp.src(['src/css/styles.css'])
    .pipe(concat('styles.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./dist/css/'));
})

// When running 'gulp' on the terminal this task will fire.
// It will start watching for changes in every .js file.
// If there's a change, the task 'scripts' defined above will fire.
gulp.task('default', ['scripts', 'css', 'watch'])

// Private Functions
// ----------------------------------------------------------------------------
function bundleApp(isProduction) {
	scriptsCount++
	// Browserify will bundle all our js files together in to one and will let
	// us use modules in the front end.
	var appBundler = browserify({
  	entries: './src/js/index.js',
  	debug: true
	})

	// If it's not for production, a separate vendors.js file will be created
	// the first time gulp is run so that we don't have to rebundle things like
	// react everytime there's a change in the js file
	if (!isProduction && scriptsCount === 1) {
		// create vendors.js for dev environment.
		browserify({
			require: dependencies,
			debug: true
		})
		.bundle()
		.on('error', gutil.log)
		.pipe(source('vendors.js'))
		.pipe(gulp.dest('./dist/js/'))
	}
	if (!isProduction){
		// make the dependencies external so they dont get bundled by the
	  // app bundler. Dependencies are already bundled in vendor.js for
	  // development environments.
		dependencies.forEach(function(dep){
			appBundler.external(dep)
		})
	}

	if (isProduction) {
		process.env.NODE_ENV = 'production'
		appBundler
			// transform ES6 and JSX to ES5 with babelify
	  	.transform('babelify', {presets: ['@babel/preset-env', '@babel/preset-react']})
	    .bundle()
	    .on('error',gutil.log)
	    .pipe(source('bundle.js'))
			.pipe(buffer())
			.pipe(uglify())
	    .pipe(gulp.dest('./dist/js/'))

		browserify({
			require: dependencies,
			debug: true
		})
		.bundle()
		.on('error', gutil.log)
		.pipe(source('vendors.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest('./dist/js/'))
	} else {
		appBundler
			// transform ES6 and JSX to ES5 with babelify
	  	.transform('babelify', {presets: ['@babel/preset-env', '@babel/preset-react']})
	    .bundle()
	    .on('error',gutil.log)
	    .pipe(source('bundle.js'))
	    .pipe(gulp.dest('./dist/js/'))
	}

}
