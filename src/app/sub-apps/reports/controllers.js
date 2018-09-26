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

		try {

			const { response, body } = await backend.reports.getAll( req );

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
		const form = new Form( req, {

			isResolved: {
				type: Form.RADIO,
				values: [ sessionValues.isResolved, report.is_resolved ],
				items: govukItemsFromObj( metadata.bool ),
				validators: [{
					fn: validators.isMetadata( 'bool' ),
					message: 'Answer if the barrier been resolved'
				}]
			},

			resolvedDate: {
				type: Form.GROUP,
				conditional: { name: 'isResolved', value: 'true' },
				errorField: 'resolved_date',
				validators: [ {
					fn: validators.isDateValue( 'month' ),
					message: 'Enter a month'
				},{
					fn: validators.isDateValue( 'year' ),
					message: 'Enter a year'
				},{
					fn: validators.isDateValid,
					message: 'Enter a valid date'
				},{
					fn: validators.isDateInPast,
					message: 'Enter a date that is in the past'
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
				items: metadata.countryList,
				validators: [
					{
						fn: validators.isCountry,
						message: 'Choose an export country/trading bloc'
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
					message: 'Answer if you know which sector is affected'
				} ]
			}
		} );

		function getRedirectUrl(){

			const { hasSectors } = form.getValues();
			const urlMethod = ( hasSectors === 'true' ? 'addSector' : 'aboutProblem' );

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
				items: metadata.affectedSectorsList,
				validators: [ {
					fn: validators.isSector,
					message: 'Select a sector'
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
				required: 'Enter the product or service being exported'
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
				values: [ report.source ],
				items: govukItemsFromObj( metadata.barrierAwareness ),
				validators: [
					{
						fn: validators.isMetadata( 'barrierAwareness' ),
						message: 'Select an option'
					}
				]
			},

			barrierAwarenessOther: {
				values: [ report.other_source ],
				conditional: { name: 'barrierAwareness', value: 'OTHER' },
				required: 'Answer how you became aware'
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
			saveFormData: ( formValues ) => backend.reports.saveProblem( req, report.id, formValues ),
			saved: () => res.redirect( urls.reports.detail( report.id ) )
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

				res.redirect( urls.reports.success( reportId ) );

			} else {

				res.redirect( urls.reports.detail( reportId ) );
			}

		} catch( e ){

			return next( e );
		}
	},

	success: ( req, res ) => res.render( 'reports/views/success', { uuid: req.uuid } )
};
