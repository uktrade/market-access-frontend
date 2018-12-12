const appConfig = require( '../../app/config' );

const port = appConfig.server.port;
const paths = [
	[ '/', 'Homepage', [] ],
	[ '/reports/', 'Unfinished reports', [] ],
	[ '/reports/new/', 'New report', [] ],
	[ '/reports/new/start/', 'Start new report', [] ],
	[ '/what-is-a-barrier/', 'What is a barrier', [] ],
	[ '/find-a-barrier/', 'Find a barrier', [] ],

	//temporary pages
	// [ '/reports/<report-uuid>/', 'Report tasks' ],
	// [ '/reports/<report-uuid>/problem/', 'Report - about (resolved)' ],
	// [ '/reports/<report-uuid>/is-resolved/', 'Report - is resolved' ],
	// [ '/barriers/<barrier-uuid>/', 'Barrier detail' ],
	// [ '/barriers/<barrier-uuid>/interactions/', 'Barrier interactions' ],
	// [ '/barriers/<barrier-uuid>/interactions/add-note/', 'Barrier interactions - add note' ],
	// [ '/barriers/<barrier-uuid>/edit/', 'Edit barrier headlines' ],
	// [ '/barriers/<barrier-uuid>/companies/search/', 'Barrier company search' ],
	// [ '/barriers/<barrier-uuid>/sectors/new/', 'Barrier - add sectors' ],
	// [ '/barriers/<barrier-uuid>/edit/product/', 'Barrier - edit product' ],
	// [ '/barriers/<barrier-uuid>/edit/description/', 'Barrier - edit description' ],
	// [ '/barriers/<barrier-uuid>/edit/source/', 'Barrier - edit source' ],
];

const scenarios = paths.reduce( ( output, pathInfo ) => {

	const [ path, label, opts ] = pathInfo;

	output.push( Object.assign( {
		label,
		url: `http://localhost:${ port }${ path }`,
		selectors: [ 'document' ],
		misMatchThreshold: 0,
		requireSameDimensions: true
	}, opts ) );

	return output;

}, [] );

module.exports = {
	id: 'dev-test',
	viewports: [
		{
			"name": 'desktop',
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
