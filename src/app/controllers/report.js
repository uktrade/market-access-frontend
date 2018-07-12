const urls = require( '../lib/urls' );
const metadata = require( '../lib/metadata' );
const backend = require( '../lib/backend-service' );
const datahub = require( '../lib/datahub-service' );
const Form = require( '../lib/Form' );
const govukItemsFromObj = require( '../lib/govuk-items-from-object' );
const validators = require( '../lib/validators' );

const reportDetailViewModel = require( '../lib/view-models/report/detail' );

function barrierTypeToRadio( item ){

	const { id, title, category } = item;

	return {
		value: id,
		text: title,
		category
	};
}

function groupBarrierTypes( types ){

	const items = {
		GOODS: [],
		SERVICES: []
	};

	for( let type of types ){
		items[ type.category ].push( type );
	}

	return {
		goods: items.GOODS,
		services: items.SERVICES
	};
}

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

			req.error( 'company', 'Enter a search term' );
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

			const { id, name, sector } = req.company;
			req.session.reportCompany = { id, name, sector };

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
			let values = Object.assign( {}, sessionStartForm, { company: sessionCompany }, { contactId: sessionContact } );

			if( isUpdate ){
				({ response, body } = await backend.updateReport( req, reportId, values ));
			} else {
				({ response, body } = await backend.saveNewReport( req, values ));
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

			countryItems.unshift( {	value: '', text: 'Choose a country' } );
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
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.saveProblem( req, report.id, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( form.isExit ? urls.report.detail( report.id ) : urls.report.impact( report.id ) );

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

	impact: async ( req, res, next ) => {

		const report = req.report;
		const form = new Form( req, {

			impact: {
				values: [ report.problem_impact ],
				required: 'Describe the impact of the problem'
			},

			losses: {
				type: Form.RADIO,
				values: [ report.estimated_loss_range ],
				items: govukItemsFromObj( metadata.lossScale ),
				validators: [ {
					fn: validators.isMetadata( 'lossScale' ),
					message: 'Answer the value of losses'
				} ]
			},

			otherCompanies: {
				type: Form.RADIO,
				values: [ report.other_companies_affected ],
				items: govukItemsFromObj( metadata.boolScale ),
				validators: [ {
					fn: validators.isMetadata( 'boolScale' ),
					message: 'Answer if any other companies are affected'
				} ]
			},

			otherCompaniesInfo: {
				values: [ report.other_companies_info ],
				conditional: { name: 'otherCompanies', value: '1' },
				required: 'Enter information on the other companies'
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.saveImpact( req, report.id, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( form.isExit ? urls.report.detail( report.id ) : urls.report.legal( report.id ) );

					} else {

						return next( new Error( `Unable to save report, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'report/impact', form.getTemplateValues() );
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
				checkboxes: {
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

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.saveLegal( req, report.id, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( form.isExit ? urls.report.detail( report.id ) : urls.report.type( report.id ) );

					} else {

						return next( new Error( `Unable to save report, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'report/legal', form.getTemplateValues() );
	},

	type: async ( req, res, next ) => {

		const report = req.report;
		const form = new Form( req, {
			barrierType: {
				type: Form.RADIO,
				items: metadata.barrierTypes.map( barrierTypeToRadio ),
				values: [ report.barrier_type ],
				validators: [ {
					fn: validators.isBarrierType,
					message: 'Select a barrier type'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.saveBarrierType( req, report.id, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( form.isExit ? urls.report.detail( report.id ) : urls.report.support( report.id ) );

					} else {

						return next( new Error( `Unable to save report, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		const data = form.getTemplateValues();
		data.items = groupBarrierTypes( data.barrierType );

		res.render( 'report/type', data );
	},

	support: async ( req, res, next ) => {

		const report = req.report;
		const form = new Form( req, {
			resolved: {
				type: Form.RADIO,
				values: [ report.is_resolved ],
				items: govukItemsFromObj( metadata.bool ),
				validators: [ {
					fn: validators.isMetadata( 'bool' ),
					message: 'Answer if the barrier has been resolved'
				} ]
			},
			supportType: {
				type: Form.RADIO,
				values: [ report.support_type ],
				items: govukItemsFromObj( metadata.supportType ),
				conditional: { name: 'resolved', value: 'false' },
				validators: [ {
					fn: validators.isMetadata( 'supportType' ),
					message: 'Answer what type of support you would like'
				} ]
			},
			stepsTaken: {
				values: [ report.steps_taken ],
				conditional: { name: 'resolved', value: 'false' },
				required: 'Provide a summary of key steps/actions taken so far'
			},
			politicalSensitivities: {
				type: Form.RADIO,
				values: [ report.is_politically_sensitive ],
				items: govukItemsFromObj( metadata.bool ),
				validators: [ {
					fn: validators.isMetadata( 'bool' ),
					message: 'Answer if there are any political sensitivities'
				} ]
			},
			sensitivitiesDescription: {
				values: [ report.political_sensitivity_summary ],
				conditional: { name: 'politicalSensitivities', value: 'true' },
				required: 'Describe any political sensitivities'
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.saveSupport( req, report.id, form.getValues() );

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

		res.render( 'report/support', form.getTemplateValues() );
	},

	nextSteps: async ( req, res, next ) => {

		const report = req.report;
		const form = new Form( req, {

			response: {
				type: Form.RADIO,
				values: [ report.govt_response_requested ],
				items: govukItemsFromObj( metadata.govResponse ),
				validators: [ {
					fn: validators.isMetadata( 'govResponse' ),
					message: 'Select a valid choice for type of UK goverment response'
				} ]
			},

			sensitivities: {
				type: Form.RADIO,
				values: [ report.is_commercially_sensitive ],
				items: govukItemsFromObj( metadata.bool ),
				validators: [ {
					fn: validators.isMetadata( 'bool' ),
					message: 'Select a valid choice for any sensitivities'
				} ]
			},

			sensitivitiesText: {
				values: [ report.commercial_sensitivity_summary ],
				conditional: { name: 'sensitivities', value: 'true' },
				required: 'Describe the sensitivities'
			},

			permission: {
				type: Form.RADIO,
				values: [ report.can_publish ],
				items: govukItemsFromObj( metadata.publishResponse ),
				validators: [ {
					fn: validators.isMetadata( 'publishResponse' ),
					message: 'Select a valid choice for if we can publish the summary'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.saveNextSteps( req, report.id, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( urls.report.detail( report.id ) );

					} else {

						return next( new Error( `Unable to save report, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'report/next-steps', form.getTemplateValues() );
	},

	submit: async ( req, res, next ) => {

		try {

			const { response } = await	backend.submitReport( req, req.report.id );

			if( response.isSuccess ){

				res.render( 'report/submitted' );

			} else {

				res.redirect( urls.report.detail( req.report.id ) );
			}

		} catch( e ){

			return next( e );
		}
	}
};
