const backend = require( '../../lib/backend-service' );
const Form = require( '../../lib/Form' );
const urls = require( '../../lib/urls' );
const validators = require( '../../lib/validators' );
const detailVieWModel = require( './view-models/detail' );

function sortByDate( a, b ){

	const aDate = Date.parse( a.created_on );
	const bDate = Date.parse( b.created_on );

	return ( aDate === bDate ? 0 : ( aDate > bDate ? -1 : 1 ) );
}

function getInteractionsList( interactions ){

	const pinned = [];
	const other = [];

	for( let item of interactions ){

		if( !item.text ){ continue; }

		if( item.pinned ){
			pinned.push( item );
		} else {
			other.push( item );
		}
	}

	pinned.sort( sortByDate );
	other.sort( sortByDate );

	return pinned.concat( other );
}

async function renderInteractions( req, res, next, data ){

	try {

		const { response, body } = await backend.barriers.getInteractions( req, req.barrier.id );

		if( response.isSuccess ){

			res.render( 'barriers/views/interactions', Object.assign(
				detailVieWModel( req.barrier ),
				{ interactions: getInteractionsList( body.results ) },
				data
			) );

		} else {

			next( new Error( `Unable to get interactions, got ${ response.statusCode } response from backend` ) );
		}

	} catch( e ){

		next( e );
	}
}

module.exports = {

	barrier: ( req, res ) => res.render( 'barriers/views/detail', detailVieWModel( req.barrier ) ),

	interactions: async ( req, res, next ) => renderInteractions( req, res, next ),

	addNote: async ( req, res, next ) => {

		const barrier = req.barrier;

		const form = new Form( req, {
			_csrf: {
				values: [ req.csrfToken() ]
			},
			note: {
				required: 'Add some text for the note.'
			},
			pinned: {}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.barriers.saveNote( req, barrier.id, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( urls.barriers.interactions( barrier.id ) );

					} else {

						return next( new Error( `Unable to save barrier note, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		renderInteractions( req, res, next, Object.assign( {},
			{ noteForm: true },
			form.getTemplateValues()
		) );
	},

	status: async ( req, res, next ) => {

		const RESOLVE = 'resolve';
		const HIBERNATE = 'hibernate';
		const OPEN = 'open';

		const barrier = req.barrier;
		const currentStatus = barrier.current_status.status;
		const configItems = {
			[ RESOLVE ]: {
				serviceMethod: 'resolve',
				successPage: 'statusResolved',
				label: 'Mark as <strong>resolved</strong>',
				fields: {
					resolvedDate: {
						type: Form.GROUP,
						conditional: { name: 'status', value: RESOLVE },
						errorField: 'status_date',
						validators: [ {
							fn: validators.isDateValue( 'day' ),
							message: 'Enter a day'
						},{
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
							day: {},
							month: {},
							year: {}
						}
					},

					resolvedSummary: {
						conditional: { name: 'status', value: RESOLVE },
						errorField: 'summary',
						required: 'Enter a summary'
					}
				}
			},
			[ HIBERNATE ]: {
				serviceMethod: 'hibernate',
				successPage: 'statusHibernated',
				label: 'Mark as <strong>hibernation</strong>',
				fields: {
					hibernationSummary: {
						conditional: { name: 'status', value: HIBERNATE },
						errorField: 'summary',
						required: 'Enter a summary'
					},
				}
			},
			[ OPEN ]: {
				serviceMethod: 'open',
				successPage: 'statusOpen',
				label: 'Mark as <strong>open</strong>',
				fields: {
					reopenSummary: {
						conditional: { name: 'status', value: OPEN },
						errorField: 'summary',
						required: 'Enter a summary'
					}
				}
			}
		};

		let formOptions;
		const items = [];
		const formFields = {};

		switch( currentStatus ){
			case 2: //Open
				formOptions = [ RESOLVE, HIBERNATE ];
			break;
			case 4: //Resolved
				formOptions = [ OPEN, HIBERNATE ];
			break;
			case 5: //Hibernated
				formOptions = [ OPEN, RESOLVE ];
			break;
		}

		for( let option of formOptions ){

			const configItem = configItems[ option ];

			items.push( {
				value: option,
				html: configItem.label
			} );

			for( let [ key, value ] of Object.entries( configItem.fields ) ){
				formFields[ key ] = value;
			}
		}

		formFields.status = {
			type: Form.RADIO,
			values: [ currentStatus ],
			items,
			validators: [
				{
					fn: ( value ) => formOptions.includes( value ),
					message: 'Choose a status'
				}
			]
		};

		const form = new Form( req, formFields );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const formValues = form.getValues();
					const configItem = configItems[ formValues.status ];

					const { response, body } = await backend.barriers[ configItem.serviceMethod ]( req, req.barrier.id, formValues );

					if( response.isSuccess ){

						return res.redirect( urls.barriers[ configItem.successPage ]( req.barrier.id ) );

					} else if ( response.statusCode === 400 && body.fields ){

						form.addErrors( body.fields );

						if( !form.hasErrors() ){

							return next( new Error( `Unable to save barrier status, got ${ response.statusCode } from backend` ) );
						}

					} else {

						return next( new Error( `Unable to save barrier status, got ${ response.statusCode } from backend` ) );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'barriers/views/status', form.getTemplateValues() );
	},

	statusResolved: ( req, res ) => res.render( 'barriers/views/status-resolved', { barrierId: req.uuid } ),
	statusHibernated: ( req, res ) => res.render( 'barriers/views/status-hibernated', { barrierId: req.uuid } ),
	statusOpen: ( req, res ) => res.render( 'barriers/views/status-open', { barrierId: req.uuid } )
};
