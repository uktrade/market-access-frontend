const path = require( 'path' );
const VueLoaderPlugin = require( 'vue-loader/lib/plugin' );

module.exports = ( env = {} ) => ({
	mode: ( env.production ? 'production' : 'development' ),
	entry: './src/public/js/vue/app-vue.js',
	output: {
		path: path.resolve(__dirname, 'src/public/js/vue'),
		filename: 'vue-bundle.js'
	},
	plugins: [
		new VueLoaderPlugin(),
	],
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
				options: {
					cacheDirectory: './.tmp/babel_cache',
				},
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader',
			},
		],
	},
	resolve: {
		alias: {
			'vue$': ( env.production ? 'vue/dist/vue.runtime.esm.js' : 'vue/dist/vue.esm.js' ),
		},
	}
});
