
module.exports = function( grunt ){

	grunt.initConfig({

		pkg: grunt.file.readJSON( 'package.json' ),

		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today( "yyyy-mm-dd" ) %> */\n'
			}
		},

		clean: {
			dist: { src: [ 'dist/**/*', '!dist/node_modules/**' ] }
		},

		copy: {

			main: {
				files: [
					{
						expand: true,
						src: [ 'server.js', 'package.json', 'package-lock.json' ],
						dest: 'dist/'
					}
				]
			},

			app: {
				files: [
					{
						expand: true,
						cwd: 'src/',
						src: [ 'app/**/*', '!**/*.{js,es}hintrc' ],
						dest: 'dist/'
					}
				]
			},

			pub: {
				files: [
					{
						expand: true,
						cwd: 'src/',
						src: [ 'public/**/*', '!*/{sass,css,js}/**', '!**/*.{js,es}hintrc', '!**/*.map' ],
						dest: 'dist/'
					}
				]
			},

			//while the new frontend is in beta, copy the files
			govuk: {
				files: [
					{
						expand: true,
						cwd: 'src/',
						src: [ '@govuk-frontend/**/*' ],
						dest: 'dist/'
					}
				]
			}
		},

		useminPrepare: {
			html: 'dist/app/views/**/*.njk'
		},

		usemin: {
			html: 'dist/app/views/**/*.njk',
			js: 'dist/public/**/*.js',
			css: 'dist/public/**/*.css',
			options: {
				assetsDirs: [ 'dist', 'dist/public' ],
				patterns: {
					js: [
						[ /(img\/.*?\.(?:gif|jpeg|jpg|png|webp|svg))/gm, 'Update the JS to reference our revved images' ]
					]
				}
			}
		},

		filerev: {
			options: {
				algorithm: 'md5',
				length: 8
			},
			pub: {
				src: [ 'dist/public/**/*' ]
			}
		}
	});

	require( 'load-grunt-tasks' )( grunt );

	grunt.registerTask( 'dist', [ 'default' ] );

	grunt.registerTask( 'default', 'Default prod build', function(){

		grunt.task.run([
			'clean',
			'copy',
			'useminPrepare',
			'concat:generated',
			'cssmin:generated',
			'uglify:generated',
			'filerev',
			'usemin'
		]);
	} );
};
