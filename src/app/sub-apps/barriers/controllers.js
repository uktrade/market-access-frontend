const backend = require( '../../lib/backend-service' );
const Form = require( '../../lib/Form' );
const FormProcessor = require( '../../lib/FormProcessor' );
const urls = require( '../../lib/urls' );
const validators = require( '../../lib/validators' );
const metadata = require( '../../lib/metadata' );
const govukItemsFromObj = require( '../../lib/govuk-items-from-object' );
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

function barrierTypeToRadio( item ){

	const { id, title, category, description } = item;

	return {
		value: id,
		text: title,
		category,
		conditional: { html: `<div class="conditional-barrier-type-content">${ description.replace( '\n', '<br>' ) }</div>` }
	};
}

function isBarrierTypeCategory( category ){

	return ( item ) => item.category === category;
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
			note: {
				required: 'Add some text for the note.'
			},
			pinned: {}
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => renderInteractions( req, res, next, Object.assign( {},
				{ noteForm: true },
				templateValues
			) ),
			saveFormData: ( formValues ) => backend.barriers.saveNote( req, barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.interactions( barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
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
				label: 'Mark as <strong>paused</strong>',
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

		let configItem;
		const form = new Form( req, formFields );
		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/status', templateValues ),
			saveFormData: ( formValues ) => {

				configItem = configItems[ formValues.status ];
				return backend.barriers[ configItem.serviceMethod ]( req, req.barrier.id, formValues );
			},
			saved: () => res.redirect( urls.barriers[ configItem.successPage ]( req.barrier.id ) )
		} );

		try {

			await processor.process({ checkResponseErrors: true });

		} catch( e ){

			next( e );
		}
	},

	statusResolved: ( req, res ) => res.render( 'barriers/views/status-resolved', { barrierId: req.uuid } ),
	statusHibernated: ( req, res ) => res.render( 'barriers/views/status-hibernated', { barrierId: req.uuid } ),
	statusOpen: ( req, res ) => res.render( 'barriers/views/status-open', { barrierId: req.uuid } ),

	type: {

		list: async ( req, res, next ) => {

			const category = req.category;
			const barrier = req.barrier;
			const typeId = ( barrier.barrier_type && barrier.barrier_type.id );
			const items = metadata.barrierTypes.filter( isBarrierTypeCategory( category ) ).map( barrierTypeToRadio );
			const form = new Form( req, {
				barrierType: {
					type: Form.RADIO,
					items,
					values: [ typeId ],
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
					templateValues.category = category;

					res.render( 'barriers/views/type', templateValues );
				},
				saveFormData: ( formValues ) => backend.barriers.saveType( req, barrier.id, formValues ),
				saved: () => {

					delete req.session.typeCategoryValues;
					res.redirect( urls.barriers.detail( barrier.id ) );
				}
			} );

			try {

				await processor.process();

			} catch( e ){

				next( e );
			}
		},

		category: ( req, res ) => {

			const barrierId = req.barrier.id;
			const category = ( req.barrier.barrier_type && req.barrier.barrier_type.category );
			const form = new Form( req, {
				category: {
					type: Form.RADIO,
					values: ( category ? [ category ] : [] ),
					items: govukItemsFromObj( metadata.barrierTypeCategories ),
					validators: [ {
						fn: validators.isMetadata( 'barrierTypeCategories' ),
						message: 'Choose a barrier type category'
					} ]
				}
			} );

			if( form.isPost ){

				form.validate();

				if( !form.hasErrors() ){

					const category = form.getValues().category;
					return res.redirect( urls.barriers.type.list( barrierId, category ) );
				}
			}

			res.render( 'barriers/views/type-category', form.getTemplateValues() );
		}
	}
};
