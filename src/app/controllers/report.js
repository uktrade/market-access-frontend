const urls = require( '../lib/urls' );
const metadata = require( '../lib/metadata' );
const backend = require( '../lib/backend-service' );
const datahub = require( '../lib/datahub-service' );
const Form = require( '../lib/Form' );
const govukItemsFromObj = require( '../lib/govuk-items-from-object' );
const validators = require( '../lib/validators' );

const reportDetailViewModel = require( '../lib/view-models/report/detail' );

let countryItems;

module.exports = {

	index: ( req, res ) => res.render( 'report/index', { tasks: metadata.reportTaskList } ),

	report: ( req, res ) => res.render( 'report/detail', reportDetailViewModel( req.report ) ),

	start: ( req, res ) => {

		const sessionValues = ( req.session.startFormValues || {} );
		const report  = ( req.report || {} );
		const form = new Form( req, {

			status: {
				type: Form.RADIO,
				values: [ sessionValues.status, report.problem_status ],
				items: govukItemsFromObj( metadata.statusTypes ),
				validators: [{
					fn: validators.isMetadata( 'statusTypes' ),
					message: 'Please select the current status of the problem'
				}]
			},

			emergency: {
				type: Form.RADIO,
				values: [ sessionValues.emergency, ( report.is_emergency + '' ) ],
				items: govukItemsFromObj( metadata.bool ),
				conditional: { name: 'status', values: [ '1', '2' ] },
				validators: [{
					fn: validators.isMetadata( 'bool' ),
					message: 'Please answer if the problem is an emergency'
				}]
			}
		} );

		if( form.isPost ){

			form.validate();
			delete req.session.startFormValues;

			if( !form.hasErrors() ){

				req.session.startFormValues = form.getValues();
				return res.redirect( urls.report.companySearch( req.params.reportId ) );
			}
		}

		res.render( 'report/start', form.getTemplateValues() );
	},

	companySearch: async ( req, res, next ) => {

		const hasQueryParam = ( typeof req.query.company !== 'undefined' );
		const query = hasQueryParam && req.query.company;
		const data = {};

		//TODO: Validate search term
		if( hasQueryParam && !query ){

			req.error( 'company', 'Please enter a search term' );
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
		const reportId = req.params.reportId;
		const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status, emergency: ( req.report.is_emergency + '' ) } );
		const sessionCompany =  ( req.session.reportCompany || req.report && { id: req.report.company_id, name: req.report.company_name } );
		const sessionContact = req.session.reportContact;
		const isUpdate = !!reportId;
		const isExit = req.body.action === 'exit';

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

			delete req.session.startFormValues;
			delete req.session.reportCompany;
			delete req.session.reportContact;

			if( response.isSuccess ){

				if( !isUpdate && !body.id ){

					next( new Error( 'No id created for report' ) );

				} else {

					// TODO: Can this be cached again?
					//req.session.report = body;
					res.redirect( isExit ? urls.report.detail( body.id ) : urls.report.aboutProblem( body.id ) );
				}

			} else {

				next( new Error( `Unable to ${ isUpdate ? 'update' : 'save' } report, got ${ response.statusCode } response code` ) );
			}

		} catch( e ){

			next( e );
		}
	},

	aboutProblem: async ( req, res, next ) => {

		if( !countryItems ){

			countryItems = metadata.countries.map( ( country ) => ( {
				value: country.id,
				text: country.name
			} ) );

			countryItems.unshift( {	value: '', text: 'Please choose a country' } );
		}

		const report = req.report;
		const form = new Form( req, {

			item: {
				values: [ report.product ],
				required: 'Please enter the product or service being exported'
			},

			commodityCode: {
				values: [ ( report.commodity_codes && report.commodity_codes.join( ', ' ) ) ]
			},

			country: {
				type: Form.SELECT,
				values: [ report.export_country ],
				items: countryItems,
				required: 'Please choose an export country/trading bloc',
				validators: [
					{
						fn: validators.isCountry,
						message: 'Please select a valid export country/trading bloc'
					}
				]
			},

			description: {
				values: [ report.problem_description ],
				required: 'Please enter a brief description of the problem'
			},

			impact: {
				values: [ report.problem_impact ],
				required: 'Please describe the impact of the problem'
			},

			losses: {
				type: Form.RADIO,
				values: [ report.estimated_loss_range ],
				required: 'Please select the value of losses',
				items: govukItemsFromObj( metadata.lossScale ),
				validators: [ {
					fn: validators.isMetadata( 'lossScale' ),
					message: 'Please select a valid value of losses'
				} ]
			},

			otherCompanies: {
				type: Form.RADIO,
				values: [ report.other_companies_affected ],
				required: 'Please answer if any other companies are affected',
				items: govukItemsFromObj( metadata.boolScale ),
				validators: [ {
					fn: validators.isMetadata( 'boolScale' ),
					message: 'Please choose an answer for companies affected'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.saveProblem( req, report.id, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( form.isExit ? urls.report.detail( report.id ) : urls.report.nextSteps( report.id ) );

					} else {

						return next( new Error( `Unable to save report, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'report/about-problem', form.getTemplateValues() );
	},

	nextSteps: async ( req, res, next ) => {

		const report = req.report;
		const form = new Form( req, {

			response: {
				type: Form.RADIO,
				values: [ report.govt_response_requester ],
				required: 'Please answer the type of UK goverment response',
				items: govukItemsFromObj( metadata.govResponse ),
				validators: [ {
					fn: validators.isMetadata( 'govResponse' ),
					message: 'Please select a valid choice for type of UK goverment response'
				} ]
			},

			sensitivities: {
				type: Form.RADIO,
				values: [ report.is_confidential ],
				required: 'Please answer if there are any sensitivities',
				items: govukItemsFromObj( metadata.bool ),
				validators: [ {
					fn: validators.isMetadata( 'bool' ),
					message: 'Please select a valid choice for any sensitivities'
				} ]
			},

			sensitivitesText: {
				values: [ report.sensitivity_summary ],
				conditional: { name: 'sensitivities', value: 'true' },
				required: 'Please describe the sensitivities'
			},

			permission: {
				type: Form.RADIO,
				values: [ report.can_publish ],
				required: 'Please answer if we can publish a summary of the barrier',
				items: govukItemsFromObj( metadata.publishResponse ),
				validators: [ {
					fn: validators.isMetadata( 'publishResponse' ),
					message: 'Please select a valid choice for if we can publish the summary'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.saveNextSteps( req, report.id, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( form.isExit ? urls.report.detail( report.id ) : urls.index() );

					} else {

						return next( new Error( `Unable to save report, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'report/next-steps', form.getTemplateValues() );
	}
};
