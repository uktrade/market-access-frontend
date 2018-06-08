const urls = require( '../lib/urls' );
const backend = require( '../lib/backend-service' );
const datahub = require( '../lib/datahub-service' );
const startFormViewModel = require( '../lib/view-models/report/start-form' );

module.exports = {

	index: ( req, res ) => res.render( 'report/index' ),
	start: ( req, res ) => {

		if( req.method === 'POST' ){

			const { status, emergency } = req.body;

			//TODO: validate input
			req.session.startFormValues = { status, emergency };

			res.redirect( urls.report.company() );

		} else {

			res.render( 'report/start', startFormViewModel( req.csrfToken(), req.session.startFormValues ) );
		}
	},

	companySearch: async ( req, res, next ) => {

		const query = req.query.q;
		const data = {};

		//TODO: Validate search term

		if( query ){

			data.query = query;

			try {

				const { response, body } = await datahub.searchCompany( req, query );

				if( response.isSuccess ){

					data.results = body;

				} else if( response.statusCode === 404 ){

					data.error = 'No company found';

				} else {

					data.error = 'There was an error finding the company';
				}

			} catch ( e ){

				return next( e );
			}
		}

		res.render( 'report/company-search', data );
	},

	companyDetails: ( req, res ) => {

		const { id, name } = req.company;
		req.session.reportCompany = { id, name };

		res.render( 'report/company-details', {
			csrfToken: req.csrfToken(),
			company: req.company
		} );
	},

	saveNew: async ( req, res, next ) => {

		const companyId = req.body.companyId;
		let sessionCompany = req.session.reportCompany;
		//TODO: Validate company id

		if( !sessionCompany ){
			return res.redirect( urls.report.company() );
		}

		if( companyId !== sessionCompany.id ){
			return next( new Error( 'Company id does\'t match session' ) );
		}

		delete req.session.reportCompany;

		try {

			const { response, body } = await backend.saveNewReport( req, req.session.startFormValues, sessionCompany );
			const isExit = ( req.body.action === 'exit' );

			if( response.isSuccess ){

				delete req.session.startFormValues;
				res.redirect( isExit ? urls.index() : urls.report.contacts( companyId ) );

			} else {

				next( new Error( `Unable to save report, got ${ response.statusCode } response code` ) );
			}

		} catch( e ){

			next( e );
		}
	},

	contacts: ( req, res ) => {
		res.render( 'report/contacts', { company: req.company } );
	}
};
