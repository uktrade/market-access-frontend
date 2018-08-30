const urls = require( '../../lib/urls' );
const metadata = require( '../../lib/metadata' );
const backend = require( '../../lib/backend-service' );
const datahub = require( '../../lib/datahub-service' );
const Form = require( '../../lib/Form' );
const FormProcessor = require( '../../lib/FormProcessor' );
const govukItemsFromObj = require( '../../lib/govuk-items-from-object' );
const validators = require( '../../lib/validators' );

const reportDetailViewModel = require( './view-models/detail' );
const reportsViewModel = require( './view-models/reports' );

function barrierTypeToRadio( item ){

	const { id, title, category } = item;

	return {
		value: id,
		text: title,
		category
	};
}

function isBarrierTypeCategory( category ){

	return ( item ) => item.category === category;
}

let countryItems;

module.exports = {

	index: async ( req, res, next ) => {

		try {

			const { response, body } = await backend.reports.getAllUnfinished( req );

			if( response.isSuccess ){

				res.render( 'reports/views/index', reportsViewModel( body.results ) );

			} else {

				throw new Error( `Got ${ response.statusCode } response from backend` );
			}

		} catch( e ){

			next( e );
		}
	},

	new: ( req, res ) => res.render( 'reports/views/new', { tasks: metadata.reportTaskList } ),

	report: ( req, res ) => res.render( 'reports/views/detail', reportDetailViewModel( req.csrfToken(), req.report ) ),

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
					message: 'Select the current status of the problem'
				}]
			},

			emergency: {
				type: Form.RADIO,
				values: [ sessionValues.emergency, ( report.is_emergency + '' ) ],
				items: govukItemsFromObj( metadata.bool ),
				conditional: { name: 'status', values: [ '1', '2' ] },
				validators: [{
					fn: validators.isMetadata( 'bool' ),
					message: 'Answer if the problem is an emergency'
				}]
			}
		} );

		if( form.isPost ){

			form.validate();
			delete req.session.startFormValues;

			if( !form.hasErrors() ){

				req.session.startFormValues = form.getValues();
				return res.redirect( urls.reports.companySearch( report.id ) );
			}
		}

		res.render( 'reports/views/start', form.getTemplateValues() );
	},

	companySearch: async ( req, res, next ) => {

		const hasQueryParam = ( typeof req.query.company !== 'undefined' );
		const query = hasQueryParam && req.query.company;
		const data = {};

		//TODO: Validate search term
		if( hasQueryParam && !query ){

			req.error( 'company', 'Enter a search term' );
		}

		if( query ){

			data.query = query;

			try {

				const { response, body } = await datahub.searchCompany( req, query );

				if( response.isSuccess ){

					data.results = body;

				} else {

					let message;

					switch( response.statusCode ){

						case 404:
							message = 'No company found';
						break;
						case 403:
							message = 'You do not have permission to search for a company, please contact Data Hub support.';
						break;
						default:
							message = 'There was an error finding the company';
					}

					data.error = message;
				}

			} catch ( e ){

				return next( e );
			}
		}

		res.render( 'reports/views/company-search', data );
	},

	companyDetails: ( req, res ) => {

		if( req.method === 'POST' ){

			const companyId = req.body.companyId;
			const reportId = ( req.report && req.report.id );

			if( companyId === req.session.reportCompany.id ){

				res.redirect( urls.reports.contacts( companyId, reportId ) );

			} else {

				res.redirect( urls.reports.companySearch( reportId ) );
			}

		} else {

			const { id, name, sector } = req.company;
			req.session.reportCompany = { id, name, sector };

			res.render( 'reports/views/company-details', {
				csrfToken: req.csrfToken()
			} );
		}
	},

	contacts: async ( req, res ) => res.render( 'reports/views/contacts' ),

	contactDetails: ( req, res ) => {
		req.session.reportContact = req.contact.id;
		res.render( 'reports/views/contact-details', { csrfToken: req.csrfToken() } );
	},

	save: async ( req, res, next ) => {

		const contactId = req.body.contactId;
		const reportId = ( req.report && req.report.id );
		const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status, emergency: ( req.report.is_emergency + '' ) } );
		const sessionCompany =  ( req.session.reportCompany || req.report && { id: req.report.company_id, name: req.report.company_name } );
		const sessionContact = req.session.reportContact;
		const isUpdate = !!reportId;
		const isExit = req.body.action === 'exit';

		if( !sessionContact ){ return res.redirect( urls.reports.contacts( sessionCompany.id ) ); }

		if( contactId !== sessionContact ){
			return next( new Error( 'Contact id doesn\'t match session' ) );
		}

		try {

			let response;
			let body;
			let values = Object.assign( {}, sessionStartForm, { company: sessionCompany }, { contactId: sessionContact } );

			if( isUpdate ){
				({ response, body } = await backend.reports.update( req, reportId, values ));
			} else {
				({ response, body } = await backend.reports.save( req, values ));
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
					res.redirect( isExit ? urls.reports.detail( body.id ) : urls.reports.aboutProblem( body.id ) );
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

			countryItems.unshift( { value: '', text: 'Choose a country' } );
		}

		const report = req.report;
		const form = new Form( req, {

			item: {
				values: [ report.product ],
				required: 'Enter the product or service being exported'
			},

			commodityCode: {
				values: [ report.commodity_codes ]
			},

			country: {
				type: Form.SELECT,
				values: [ report.export_country ],
				items: countryItems,
				validators: [
					{
						fn: validators.isCountry,
						message: 'Choose an export country/trading bloc'
					}
				]
			},

			description: {
				values: [ report.problem_description ],
				required: 'Enter a brief description of the problem'
			},

			barrierTitle: {
				values: [ report.barrier_title ],
				required: 'Enter a barrier title'
			},

			barrierAwareness: {
				type: Form.RADIO,
				values: [ report.barrier_awareness ],
				items: govukItemsFromObj( metadata.barrierAwareness ),
				validators: [
					{
						fn: validators.isMetadata( 'barrierAwareness' ),
						message: 'Select an option'
					}
				]
			},

			barrierAwarenessOther: {
				values: [ report.barrier_awareness_other ],
				conditional: { name: 'barrierAwareness', value: '4' },
				required: 'Answer how you became aware'
			},
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'reports/views/about-problem', templateValues ),
			saveFormData: ( formValues ) => backend.reports.saveProblem( req, report.id, formValues ),
			saved: () => res.redirect( form.isExit ? urls.reports.detail( report.id ) : urls.reports.legal( report.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	legal: async ( req, res, next ) => {

		const report = req.report;
		const form = new Form( req, {
			hasInfringed: {
				type: Form.RADIO,
				values: [ report.has_legal_infringement ],
				items: govukItemsFromObj( metadata.boolScale ),
				validators: [ {
					fn: validators.isMetadata( 'boolScale' ),
					message: 'Answer if any legal obligations have been infringed'
				} ]
			},
			infringements: {
				type: Form.CHECKBOXES,
				conditional: { name: 'hasInfringed', value: '1' },
				validators: [ {
					fn: validators.isOneBoolCheckboxChecked,
					message: 'Select at least one infringement'
				} ],
				items: {
					wtoInfringement: {
						values: [ report.wto_infringement ]
					},
					ftaInfringement: {
						values: [ report.fta_infringement ]
					},
					otherInfringement: {
						values: [ report.other_infringement ]
					}
				}
			},
			infringementSummary: {
				values: [ report.infringement_summary ],
				conditional: { name: 'hasInfringed', value: '1' },
				required: 'List the provisions infringed'
			}
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'reports/views/legal', templateValues ),
			saveFormData: ( formValues ) => backend.reports.saveLegal( req, report.id, formValues ),
			saved: () => res.redirect( form.isExit ? urls.reports.detail( report.id ) : urls.reports.typeCategory( report.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	typeCategory: ( req, res ) => {

		const report = req.report;
		const sessionValues = req.session.typeCategoryValues;
		const categoryValue = ( sessionValues && sessionValues.category );
		const form = new Form( req, {
			category: {
				type: Form.RADIO,
				items: govukItemsFromObj( metadata.barrierTypeCategories ),
				values: [ categoryValue, report.barrier_type_category ],
				validators: [ {
					fn: validators.isMetadata( 'barrierTypeCategories' ),
					message: 'Choose a barrier type category'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();
			delete req.session.typeCategoryValues;

			if( !form.hasErrors() ){

				req.session.typeCategoryValues = form.getValues();
				return res.redirect( urls.reports.type( report.id ) );
			}
		}

		res.render( 'reports/views/type-category', form.getTemplateValues() );
	},

	type: async ( req, res, next ) => {

		const report = req.report;
		const category = req.session.typeCategoryValues.category;
		const items = metadata.barrierTypes.filter( isBarrierTypeCategory( category ) ).map( barrierTypeToRadio );
		const form = new Form( req, {
			barrierType: {
				type: Form.RADIO,
				items,
				values: [ report.barrier_type_id ],
				validators: [ {
					fn: validators.isBarrierType,
					message: 'Select a barrier type'
				} ]
			}
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => {

				templateValues.title = metadata.barrierTypeCategories[ category ];

				res.render( 'reports/views/type', templateValues );
			},
			saveFormData: ( formValues ) => backend.reports.saveBarrierType( req, report.id, formValues ),
			saved: () => {

				delete req.session.typeCategoryValues;
				res.redirect( form.isExit ? urls.reports.detail( report.id ) : urls.reports.detail( report.id ) );
			}
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	submit: async ( req, res, next ) => {

		const reportId = req.report.id;

		try {

			const { response } = await	backend.reports.submit( req, reportId );

			if( response.isSuccess ){

				res.redirect( urls.reports.success() );

			} else {

				res.redirect( urls.reports.detail( reportId ) );
			}

		} catch( e ){

			return next( e );
		}
	},

	success: ( req, res ) => res.render( 'reports/views/success' )
};
