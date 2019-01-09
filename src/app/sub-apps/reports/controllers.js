const urls = require( '../../lib/urls' );
const metadata = require( '../../lib/metadata' );
const backend = require( '../../lib/backend-service' );
const Form = require( '../../lib/Form' );
const FormProcessor = require( '../../lib/FormProcessor' );
const govukItemsFromObj = require( '../../lib/govuk-items-from-object' );
const validators = require( '../../lib/validators' );
const getDateParts = require( '../../lib/get-date-parts' );

const reportDetailViewModel = require( './view-models/detail' );
const reportsViewModel = require( './view-models/reports' );

module.exports = {

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
					message: 'Select a barrier urgency'
				}]
			}
		} );

		if( form.isPost ){

			form.validate();
			delete req.session.startFormValues;

			if( !form.hasErrors() ){

				req.session.startFormValues = form.getValues();
				return res.redirect( urls.reports.isResolved( report.id ) );
			}
		}

		res.render( 'reports/views/start', form.getTemplateValues() );
	},

	isResolved: ( req, res ) => {

		const sessionValues = ( req.session.isResolvedFormValues || {} );
		const report  = ( req.report || {} );
		const resolvedDateValues = ( sessionValues.resolvedDate || getDateParts( report.resolved_date ) || {} );
		const invalidDateMessage = 'Enter resolution date and include a month and year';
		const form = new Form( req, {

			isResolved: {
				type: Form.RADIO,
				values: [ sessionValues.isResolved, report.is_resolved ],
				items: govukItemsFromObj( metadata.bool ),
				validators: [{
					fn: validators.isMetadata( 'bool' ),
					message: 'Select if the barrier is resolved or not'
				}]
			},

			resolvedDate: {
				type: Form.GROUP,
				conditional: { name: 'isResolved', value: 'true' },
				errorField: 'resolved_date',
				validators: [ {
					fn: validators.isDateValue( 'month' ),
					message: invalidDateMessage
				},{
					fn: validators.isDateValue( 'year' ),
					message: invalidDateMessage
				},{
					fn: validators.isDateNumeric,
					message: 'Resolution date must only include numbers'
				},{
					fn: validators.isDateValid,
					message: invalidDateMessage
				},{
					fn: validators.isDateInPast,
					message: 'Resolution date must be this month or in the past'
				} ],
				items: {
					month: {
						values: [ resolvedDateValues.month ]
					},
					year: {
						values: [ resolvedDateValues.year ]
					}
				}
			},
		} );

		if( form.isPost ){

			form.validate();
			delete req.session.isResolvedFormValues;

			if( !form.hasErrors() ){

				req.session.isResolvedFormValues = form.getValues();
				return res.redirect( urls.reports.country( report.id ) );
			}
		}

		res.render( 'reports/views/is-resolved', form.getTemplateValues() );
	},

	country: async ( req, res, next ) => {

		const report  = ( req.report || {} );
		const form = new Form( req, {

			country: {
				type: Form.SELECT,
				values: [ report.export_country ],
				items: metadata.getCountryList(),
				validators: [
					{
						fn: validators.isCountry,
						message: 'Select a location for this barrier'
					}
				]
			},
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const reportId = report.id;
					const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status } );
					const sessionResolvedForm = ( req.session.isResolvedFormValues || req.report && { isResolved: req.report.is_resolved, resolvedDate: req.report.resolved_date } );
					const isUpdate = !!reportId;

					let response;
					let body;
					let values = Object.assign( {}, sessionStartForm, sessionResolvedForm, form.getValues() );

					if( isUpdate ){
						({ response, body } = await backend.reports.update( req, reportId, values ));
					} else {
						({ response, body } = await backend.reports.save( req, values ));
					}

					if( response.isSuccess ){

						delete req.session.startFormValues;
						delete req.session.isResolvedFormValues;

						if( !isUpdate && !body.id ){

							return next( new Error( 'No id created for report' ) );

						} else {

							// TODO: Can this be cached again?
							//req.session.report = body;
							return res.redirect( urls.reports.hasSectors( body.id ) );
						}

					} else {

						return next( new Error( `Unable to ${ isUpdate ? 'update' : 'save' } report, got ${ response.statusCode } response code` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'reports/views/country', form.getTemplateValues() );
	},

	hasSectors: async ( req, res, next ) => {

		const boolItems = govukItemsFromObj( metadata.bool );
		const items = boolItems.map( ( item ) => item.value === 'false' ? { value: item.value, text: 'No, I don\'t know at the moment' } : item );
		const report = req.report;
		const form = new Form( req, {

			hasSectors: {
				type: Form.RADIO,
				items,
				values: [ report.sectors_affected ],
				validators: [ {
					fn: validators.isMetadata( 'bool' ),
					message: 'Select if you are aware of a sector affected by the barrier'
				} ]
			}
		} );

		function getRedirectUrl(){

			const { hasSectors } = form.getValues();
			const sectorsList = ( report.sectors || req.session.sectors );
			const hasListOfSectors = ( Array.isArray( sectorsList ) && sectorsList.length > 0 );
			const urlMethod = ( hasSectors === 'true' ? ( hasListOfSectors ? 'sectors' : 'addSector' ) : 'aboutProblem' );

			return urls.reports[ urlMethod ]( report.id );
		}

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'reports/views/has-sectors', templateValues ),
			saveFormData: ( formValues ) => backend.reports.saveHasSectors( req, report.id, formValues ),
			saved: () => res.redirect( form.isExit ? urls.reports.detail( report.id ) : getRedirectUrl() )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	sectors: async ( req, res, next ) => {

		const report = req.report;
		const reportId = report.id;
		const isPost = req.method === 'POST';

		if( !req.session.sectors ){
			req.session.sectors = ( report.sectors || [] );
		}

		const sectors = req.session.sectors;

		if( isPost ){

			if( sectors && sectors.length ){

				try {

					delete req.session.sectors;

					const { response } = await backend.reports.saveSectors( req, reportId, { sectors } );

					if( response.isSuccess ){

						const isExit = ( req.body.action === 'exit' );
						return res.redirect( isExit ? urls.reports.detail( reportId ) : urls.reports.aboutProblem( reportId ) );

					} else {

						return next( new Error( `Unable to update report, got ${ response.statusCode } response code` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'reports/views/sectors', { sectors: sectors.map( metadata.getSector ), csrfToken: req.csrfToken() } );
	},

	removeSector: ( req, res ) => {

		const sectorToRemove = req.body.sector;

		req.session.sectors = req.session.sectors.filter( ( sector ) => sector !== sectorToRemove );

		res.redirect( urls.reports.sectors( req.report.id ) );
	},

	addSector: ( req, res ) => {

		const report = req.report;

		if( !req.session.sectors ){

			req.session.sectors = ( report.sectors || [] );
		}

		const sectors = req.session.sectors;
		const form = new Form( req, {

			sectors: {
				type: Form.SELECT,
				items: metadata.getSectorList().filter( ( sector ) => !sectors.includes( sector.value ) ),
				validators: [ {
					fn: validators.isSector,
					message: 'Select a sector affected by the barrier'
				},{
					fn: ( value ) => !sectors.includes( value ),
					message: 'Sector already added, choose another'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				sectors.push( form.getValues().sectors );
				req.session.sectors = sectors;

				return res.redirect( urls.reports.sectors( report.id ) );
			}
		}

		res.render( 'reports/views/add-sector', Object.assign( form.getTemplateValues(), { currentSectors: sectors.map( metadata.getSector ) } ) );
	},

	aboutProblem: async ( req, res, next ) => {

		const report = req.report;
		const isResolved = report.is_resolved;
		const formConfig = {

			item: {
				values: [ report.product ],
				required: 'Enter a product or service'
			},

			barrierSource: {
				type: Form.RADIO,
				values: [ report.source ],
				items: govukItemsFromObj( metadata.barrierSource ),
				validators: [
					{
						fn: validators.isMetadata( 'barrierSource' ),
						message: 'Select how you became aware of the barrier'
					}
				]
			},

			barrierSourceOther: {
				values: [ report.other_source ],
				conditional: { name: 'barrierSource', value: 'OTHER' },
				required: 'Enter how you became aware of the barrier'
			},

			barrierTitle: {
				values: [ report.barrier_title ],
				required: 'Enter a title for this barrier'
			},

			description: {
				values: [ report.problem_description ],
				required: 'Enter a brief description for this barrier'
			},
		};

		if( isResolved ){

			formConfig.resolvedDescription = {
				values: [ report.status_summary ],
				required: 'Enter an explanation of how you solved this barrier'
			};
		}

		const form = new Form( req, formConfig );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => {

				const hasSectors = ( report.sectors_affected === true );
				const urlMethod = ( hasSectors ? 'sectors' : 'hasSectors' );

				templateValues.backHref =  urls.reports[ urlMethod ]( report.id );
				templateValues.isResolved = isResolved;

				res.render( 'reports/views/about-problem', templateValues );
			},
			saveFormData: ( formValues ) => backend.reports.saveProblemAndSubmit( req, report.id, formValues ),
			saved: async ( body ) => {

				const barrierId = body.id;

				req.flash( 'barrier-created', barrierId );
				res.redirect( urls.barriers.detail( barrierId ) );
			}
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	}
};
