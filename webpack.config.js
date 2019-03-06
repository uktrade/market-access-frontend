const path = require( 'path' );
const commonConfig = require( './webpack.common.js' );

module.exports = ( env = {} ) => ({
	...commonConfig( env ),
	entry: './src/public/js/vue/app-vue.js',
	output: {
		path: path.resolve( __dirname, 'src/public/js/vue' ),
		filename: 'vue-bundle.js'
	},
});
