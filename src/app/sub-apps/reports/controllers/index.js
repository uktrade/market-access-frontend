const metadata = require( '../../../lib/metadata' );
const backend = require( '../../../lib/backend-service' );
const urls = require( '../../../lib/urls' );
const reportDetailViewModel = require( '../view-models/detail' );
const reportsViewModel = require( '../view-models/reports' );

async function renderDashboard( req, res, next, isDelete = false, currentReportId ){

	try {

		const { response, body } = await backend.reports.getAll( req );

		if( response.isSuccess ){

			res.render( 'reports/views/index', {
				...reportsViewModel( body.results, currentReportId ),
				csrfToken: req.csrfToken(),
				isDelete
			} );

		} else {

			throw new Error( `Got ${ response.statusCode } response from backend` );
		}

	} catch( e ){

		next( e );
	}
}

module.exports = {

	start: require( './start' ),
	isResolved: require( './is-resolved' ),
	country: require( './country' ),
	hasAdminAreas: require('./has-admin-areas'),
	adminAreas: require('./admin-areas'),
	hasSectors: require( './has-sectors' ),
	sectors: require( './sectors' ),
	aboutProblem: require( './about-problem' ),
	summary: require( './summary' ),

	index: renderDashboard,

	delete: async ( req, res, next ) => {

		const currentReportId = req.params.reportId;
		const isPost = req.method === 'POST';

		if( isPost ){

			if( req.report.created_by.id !== req.user.id ){

				return next( new Error( 'Cannot delete a note that is not created by the current user' ) );
			}

			try {

				const { response } = await backend.reports.delete( req, currentReportId );

				if( response.isSuccess ){

					res.redirect( urls.reports.index() );

				} else {

					throw new Error( `Got ${ response.statusCode } response from backend` );
				}

			} catch( e ){

				next( e );
			}

		} else {

			if( req.xhr ){

				const { reports } = reportsViewModel( [ req.report ] );
				res.render( 'reports/views/partials/delete-report-modal', { report: reports[ 0 ], csrfToken: req.csrfToken() } );

			} else {

				renderDashboard( req, res, next, true, currentReportId );
			}
		}
	},

	new: ( req, res ) => res.render( 'reports/views/new', { tasks: metadata.reportTaskList } ),

	report: ( req, res ) => res.render( 'reports/views/detail', reportDetailViewModel( req.csrfToken(), req.report ) ),

	submit: async ( req, res, next ) => {

		const reportId = req.report.id;
		try {

			const { response } = await	backend.reports.submit( req, reportId );

			if( response.isSuccess ){

				req.flash( 'barrier-created', reportId );
				res.redirect( urls.barriers.detail( reportId ) );

			} else {

				res.redirect( urls.reports.detail( reportId ) );
			}

		} catch( e ){

			next( e );
		}
	},
};
