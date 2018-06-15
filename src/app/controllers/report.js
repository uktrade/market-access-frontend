const urls = require( '../lib/urls' );
const backend = require( '../lib/backend-service' );
const datahub = require( '../lib/datahub-service' );
const startFormViewModel = require( '../lib/view-models/report/start-form' );
const aboutProblemViewModel = require( '../lib/view-models/report/about-problem' );

module.exports = {

	index: ( req, res ) => res.render( 'report/index' ),

	start: ( req, res ) => {

		if( req.method === 'POST' ){

			const { status, emergency } = req.body;

			//TODO: validate input
			req.session.startFormValues = { status, emergency };

			res.redirect( urls.report.companySearch( req.params.barrierId ) );

		} else {

			res.render( 'report/start', startFormViewModel( req.csrfToken(), req.session.startFormValues ) );
		}
	},

	companySearch: async ( req, res, next ) => {

		const query = req.query.company;
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

		if( req.method === 'POST' ){

			const companyId = req.body.companyId;
			const barrierId = req.params.barrierId;

			if( companyId === req.session.reportCompany.id ){

				res.redirect( urls.report.contacts( companyId, barrierId ) );

			} else {

				res.redirect( urls.report.companySearch( barrierId ) );
			}

		} else {

			const { id, name } = req.company;
			req.session.reportCompany = { id, name };

			res.render( 'report/company-details', {
				csrfToken: req.csrfToken()
			} );
		}
	},

	contacts: async ( req, res ) => res.render( 'report/contacts' ),

	contactDetails: ( req, res ) => {
		req.session.reportContact = req.contact.id;
		res.render( 'report/contact-details', { csrfToken: req.csrfToken() } );
	},

	save: async ( req, res, next ) => {

		const contactId = req.body.contactId;
		const sessionContact = req.session.reportContact;
		const barrierId = req.params.barrierId;
		const sessionStartForm = ( req.session.startFormValues || req.barrier && { status: req.barrier.status, emergency: req.barrier.is_emergency } );
		const sessionCompany =  ( req.session.reportCompany || req.barrier && { id: req.barrier.company_id, name: req.barrier.company_name } );
		const isBarrier = !!barrierId;
		//TODO: Validate company id

		if( !sessionContact ){ return res.redirect( urls.report.contacts( sessionCompany.id ) ); }

		if( contactId !== sessionContact ){
			return next( new Error( 'Contact id doesn\'t match session' ) );
		}

		try {

			let response;
			let body;

			if( isBarrier ){
				({ response, body } = await backend.updateBarrier( req, barrierId, sessionStartForm, sessionCompany, sessionContact ));
			} else {
				({ response, body } = await backend.saveNewBarrier( req, sessionStartForm, sessionCompany, sessionContact ));
			}

			delete req.session.reportCompany;
			delete req.session.reportContact;

			if( response.isSuccess ){

				if( !isBarrier && !body.id ){

					next( new Error( 'No id created for report' ) );

				} else {

					req.session.barrier = body;
					res.redirect( urls.report.aboutProblem( body.id ) );
				}

			} else {

				next( new Error( `Unable to ${ isBarrier ? 'update' : 'save' } report, got ${ response.statusCode } response code` ) );
			}

		} catch( e ){

			next( e );
		}
	},

	aboutProblem: ( req, res ) => res.render( 'report/about-problem', aboutProblemViewModel( req.csrfToken() ) )
};
