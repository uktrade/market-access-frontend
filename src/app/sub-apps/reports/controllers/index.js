const metadata = require( '../../../lib/metadata' );
const backend = require( '../../../lib/backend-service' );
const urls = require( '../../../lib/urls' );
const reportDetailViewModel = require( '../view-models/detail' );
const reportsViewModel = require( '../view-models/reports' );

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

	index: async ( req, res, next ) => {

		const country = req.user.country;
		const countryId = country && req.user.country.id;
		let template = 'reports/views/index';
		let promise;

		if( countryId ){

			template = 'reports/views/my-country';
			promise = backend.reports.getForCountry( req, countryId );

		} else {

			promise = backend.reports.getAll( req );
		}

		try {

			const { response, body } = await promise;

			if( response.isSuccess ){

				res.render( template, reportsViewModel( body.results, country ) );

			} else {

				throw new Error( `Got ${ response.statusCode } response from backend` );
			}

		} catch( e ){

			next( e );
		}
	},

	delete: async (req, res, next) => {
		const country = req.user.country;
		const countryId = country && req.user.country.id;
		const currentReportId = req.params.reportId;
		const isPost = req.method === 'POST';

		let template = 'reports/views/index';
		let promise;

		if(isPost){
			try {

				const { response } = await	backend.reports.delete( req, currentReportId );

				if( response.isSuccess ){

					res.redirect(urls.reports.index());
	
				} else {
	
					throw new Error( `Got ${ response.statusCode } response from backend` );
				}
			} catch( e ){
				
				next( e );

			}
		}

		if( countryId ){

			template = 'reports/views/my-country';
			promise = backend.reports.getForCountry( req, countryId );

		} else {

			promise = backend.reports.getAll( req );
		}

		try {

			const { response, body } = await promise;
			let currentReport = {}

			body.results.some((report) => {
				if (report.id === currentReportId) {
					currentReport = report;
					return
				}
			});
			
			if( response.isSuccess ){

				res.render( template, Object.assign({},{ currentReport, csrfToken: req.csrfToken(), isDelete: true }, reportsViewModel( body.results, country )) );

			} else {

				throw new Error( `Got ${ response.statusCode } response from backend` );
			}

		} catch( e ){

			next( e );
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
