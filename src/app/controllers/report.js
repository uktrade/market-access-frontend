const urls = require( '../lib/urls' );
const backend = require( '../lib/backend-service' );
const datahub = require( '../lib/datahub-service' );
const startFormViewModel = require( '../lib/view-models/report/start-form' );
const aboutProblemViewModel = require( '../lib/view-models/report/about-problem' );

module.exports = {

	index: ( req, res ) => res.render( 'report/index' ),

	start: ( req, res ) => {

		const isPost = ( req.method === 'POST' );
		const { status, emergency } = req.body || {};
		const formValues = { status, emergency };

		let hasErrors = false;

		if( isPost ){

			const statusError = ( !status || !status.length );

			if( statusError ){

				hasErrors = true;
				req.error( 'status', 'Please select the current status of the problem' );
			}

			if( !statusError ){

				if( ( status === '1' || status === '2' ) && !emergency ){

					hasErrors = true;
					req.error( 'emergency', 'Please answer if the problem is an emergency' );
				}
			}

			delete req.session.startFormValues;
		}

		if( isPost && !hasErrors ){

			//TODO: validate input
			req.session.startFormValues = formValues;

			res.redirect( urls.report.companySearch( req.params.reportId ) );

		} else {

			res.render( 'report/start', startFormViewModel( req.csrfToken(), formValues, req.session.startFormValues ) );
		}
	},

	companySearch: async ( req, res, next ) => {

		const hasQueryParam = ( typeof req.query.company !== 'undefined' );
		const query = hasQueryParam && req.query.company;
		const data = {};

		//TODO: Validate search term
		if( hasQueryParam && !query ){
			data.errors = [
				{
					href: '#company',
					text: 'Please enter a search term'
				}
			];
		}

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
			const reportId = req.params.reportId;

			if( companyId === req.session.reportCompany.id ){

				res.redirect( urls.report.contacts( companyId, reportId ) );

			} else {

				res.redirect( urls.report.companySearch( reportId ) );
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
		const reportId = req.params.reportId;
		const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.status, emergency: req.report.is_emergency } );
		const sessionCompany =  ( req.session.reportCompany || req.report && { id: req.report.company_id, name: req.report.company_name } );
		const isUpdate = !!reportId;
		//TODO: Validate company id

		if( !sessionContact ){ return res.redirect( urls.report.contacts( sessionCompany.id ) ); }

		if( contactId !== sessionContact ){
			return next( new Error( 'Contact id doesn\'t match session' ) );
		}

		try {

			let response;
			let body;

			if( isUpdate ){
				({ response, body } = await backend.updateReport( req, reportId, sessionStartForm, sessionCompany, sessionContact ));
			} else {
				({ response, body } = await backend.saveNewReport( req, sessionStartForm, sessionCompany, sessionContact ));
			}

			delete req.session.reportCompany;
			delete req.session.reportContact;

			if( response.isSuccess ){

				if( !isUpdate && !body.id ){

					next( new Error( 'No id created for report' ) );

				} else {

					req.session.report = body;
					res.redirect( urls.report.aboutProblem( body.id ) );
				}

			} else {

				next( new Error( `Unable to ${ isUpdate ? 'update' : 'save' } report, got ${ response.statusCode } response code` ) );
			}

		} catch( e ){

			next( e );
		}
	},

	aboutProblem: ( req, res ) => {

		let formValues = {};

		if( req.method === 'POST' ){

			const {
				item,
				commodityCode,
				country,
				description,
				impact,
				losses,
				otherCompanies
			} = req.body;

			if( !item ){ req.error( 'item', 'Please enter the product or service being exported' ); }
			if( !country ){ req.error( 'country', 'Please choose an export country/trading bloc' ); }
			if( !description ){ req.error( 'description', 'Please enter a brief description of the problem' ); }
			if( !impact ){ req.error( 'impact', 'Please describe the impact of the problem' ); }
			if( !losses ){ req.error( 'losses-1', 'Please select the value of losses' ); }
			if( !otherCompanies ){ req.error( 'other-companies-1', 'Please answer if any other companies are affected' ); }

			formValues = {
				item,
				commodityCode,
				country,
				description,
				impact,
				losses,
				otherCompanies
			};
		}

		res.render( 'report/about-problem', aboutProblemViewModel( req.csrfToken(), formValues ) );
	}
};
