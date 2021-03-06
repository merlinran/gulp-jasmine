'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var requireLike = require('require-like');
var jasmineRequire = requireLike(require.resolve('minijasminenode2'), true);

module.exports = function (options) {
	options = options || {};

	var miniJasmineLib = jasmineRequire('minijasminenode2');
	var color = process.argv.indexOf('--no-color') === -1;
	var reporter = options.reporter;

	if (reporter) {
		(Array.isArray(reporter) ? reporter : [reporter]).forEach(miniJasmineLib.addReporter);
	}

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-jasmine', 'Streaming not supported'));
			return cb();
		}

                delete require.cache[require.resolve(path.resolve(file.path))];
		var files = require.cache[require.resolve(path.resolve(file.path))];
                if( typeof files !== 'undefined' ) {
                    for( var i in files.children ) {
                        delete require.cache[ files.children[i].id ];
                    }
                }
		miniJasmineLib.addSpecs(file.path);

		this.push(file);
		cb();
	}, function (cb) {
		try {
			miniJasmineLib.executeSpecs({
				isVerbose: options.verbose,
				includeStackTrace: options.includeStackTrace,
				defaultTimeoutInterval: options.timeout,
				showColors: color,
				onComplete: function (arg) {
console.log(arg);
					var failedCount = arg.env.currentRunner().results().failedCount;

					if (failedCount > 0) {
						this.emit('error', new gutil.PluginError('gulp-jasmine', failedCount + ' failure'));
					}

					cb();
				}.bind(this)
			});
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-jasmine', err));
			cb();
		}
	});
};
