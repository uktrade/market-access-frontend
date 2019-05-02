const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );

module.exports = {

	index: async ( req, res, next ) => {

		const RESOLVE = 'resolve';
		const HIBERNATE = 'hibernate';
		const OPEN = 'open';

		const barrier = req.barrier;
		const currentStatus = barrier.status;
		const invalidDateMessage = 'Enter resolution date and include a month and year';
		const configItems = {
			[ RESOLVE ]: {
				serviceMethod: 'resolve',
				label: 'Mark as <strong>resolved</strong>',
				fields: {
					resolvedDate: {
						type: Form.GROUP,
						conditional: { name: 'status', value: RESOLVE },
						errorField: 'status_date',
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
			render: ( templateValues ) => res.render( 'barriers/views/status/index', templateValues ),
			saveFormData: ( formValues ) => {

				configItem = configItems[ formValues.status ];
				return backend.barriers[ configItem.serviceMethod ]( req, req.barrier.id, formValues );
			},
			saved: () => res.redirect( urls.barriers.detail( req.barrier.id ) )
		} );

		try {

			await processor.process({ checkResponseErrors: true });

		} catch( e ){

			next( e );
		}
	},
};
