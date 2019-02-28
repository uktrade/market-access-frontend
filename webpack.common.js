const VueLoaderPlugin = require( 'vue-loader/lib/plugin' );

module.exports = ( env = {} ) => ({
	mode: ( env.production ? 'production' : 'development' ),
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
			'vue$': 'vue/dist/vue.esm.js',
		},
	}
});
