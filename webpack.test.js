const path = require( 'path' );
const glob = require( 'glob' );
const commonConfig = require( './webpack.common.js' );

module.exports = ( env = {} ) => ({
	...commonConfig( env ),
	entry: glob.sync( './src/public/js/vue/**/*.spec.js' ),
	output: {
		path: path.resolve( __dirname, './.tmp/webpack-tests' ),
		filename: '[name].spec.js'
	},
});
