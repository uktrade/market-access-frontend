const appConfig = require( '../../app/config' );

const port = appConfig.server.port;
const paths = [
	[ '/', 'Homepage', [] ],
	[ '/reports/', 'Unfinished reports', [] ],
	[ '/reports/new/', 'New report', [] ],
	[ '/reports/new/start/', 'Start new report', [] ],
];

const scenarios = paths.reduce( ( output, pathInfo ) => {

	const [ path, label, hideSelectors ] = pathInfo;

	output.push( {
		label,
		url: `http://localhost:${ port }${ path }`,
		selectors: [ 'document' ],
		hideSelectors,
		misMatchThreshold: 0,
		requireSameDimensions: true
	} );

	return output;

}, [] );

module.exports = {
	id: 'dev-test',
	viewports: [
		{
			"name": 'destop',
			"width": 1200,
			"height": 800
		},
		{
			"name": 'tablet_h',
			"width": 1024,
			"height": 568
		},
		{
			"name": 'tablet_v',
			"width": 568,
			"height": 1024
		}
	],
	scenarios,
	paths: {
		bitmaps_reference: 'src/test/backstop/data/bitmaps-reference',
		bitmaps_test: 'src/test/backstop/data/bitmaps-test',
		engine_scripts: 'src/test/backstop/data/engine-scripts',
		html_report: 'src/test/backstop/data/html-report',
		ci_report: 'src/test/backstop/data/ci-report'
	},
	engine: 'phantomjs',
	report: [
		'browser', 'CI'
	],
	debug: false
};
