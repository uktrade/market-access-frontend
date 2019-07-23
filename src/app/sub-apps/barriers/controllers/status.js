const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const metadata = require( '../../../lib/metadata' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

const statusMetadata = metadata.barrier.status;
const { UNKNOWN, PENDING, OPEN, PART_RESOLVED, RESOLVED, HIBERNATED } = statusMetadata.types;
const invalidDateMessage = 'Enter resolution date and include a month and year';

function createDate( value, monthName = 'month', yearName = 'year' ){

	function createDateObj( values ){
		return { month: values[ monthName ], year: values[ yearName ] };
	}

	return {
		type: Form.GROUP,
		conditional: { name: 'status', value },
		errorField: 'status_date',
		validators: [ {
			fn: validators.isDateValue( monthName ),
			message: invalidDateMessage
		},{
			fn: validators.isDateValue( yearName ),
			message: invalidDateMessage
		},{
			fn: ( parts ) => validators.isDateNumeric( createDateObj( parts ) ),
			message: 'Resolution date must only include numbers'
		},{
			fn: ( parts ) => validators.isDateValid( createDateObj( parts ) ),
			message: invalidDateMessage
		},{
			fn: ( parts ) => validators.isDateInPast( createDateObj( parts ) ),
			message: 'Resolution date must be this month or in the past'
		} ],
		items: {
			[ monthName ]: {},
			[ yearName ]: {}
		}
	};
}

function createSummary( value ){
	return {
		conditional: { name: 'status', value },
		errorField: 'summary',
		required: 'Enter a summary'
	};
}

module.exports = {

	index: async ( req, res, next ) => {

		const barrier = req.barrier;
		const currentStatus = barrier.status.id;
		const configItems = {
			[ UNKNOWN ]: {
				serviceMethod: 'unknown',
				fields: {
					unknownSummary: createSummary( UNKNOWN ),
				}
			},
			[ PENDING ]: {
				serviceMethod: 'pending',
				fields: {
					pendingSummary: createSummary( PENDING ),
					pendingType: {
						type: Form.RADIO,
						conditional: { name: 'status', value: PENDING },
						required: 'Select a pending action',
						items: govukItemsFromObj( metadata.barrierPendingOptions ),
					},
					pendingTypeOther: {
						conditional: { name: 'pendingType', value: metadata.barrier.status.pending.OTHER },
						required: 'Enter a description for the pending action'
					}
				}
			},
			[ OPEN ]: {
				serviceMethod: 'open',
				fields: {
					reopenSummary: createSummary( OPEN ),
				}
			},
			[ PART_RESOLVED ]: {
				serviceMethod: 'partResolved',
				transformValues: ( values ) => {

					const { partMonth: month, partYear: year } = values.partResolvedDate;

					values.partResolvedDate = { month, year };

					return values;
				},
				fields: {
					partResolvedDate: createDate( PART_RESOLVED, 'partMonth', 'partYear' ),
					partResolvedSummary: createSummary( PART_RESOLVED ),
				}
			},
			[ RESOLVED ]: {
				serviceMethod: 'resolved',
				fields: {
					resolvedDate: createDate( RESOLVED ),
					resolvedSummary: createSummary( RESOLVED ),
				}
			},
			[ HIBERNATED ]: {
				serviceMethod: 'hibernated',
				fields: {
					hibernationSummary: createSummary( HIBERNATED ),
				}
			},
		};

		const items = [];
		const formFields = {};
		const validTypes = [];

		for( let typeId of Object.values( statusMetadata.types ) ){

			if( typeId == currentStatus ){
				continue;
			}

			const configItem = configItems[ typeId ];
			const typeInfo = statusMetadata.typeInfo[ typeId ];

			validTypes.push( typeId );
			items.push( {
				value: typeId,
				text: typeInfo.name,
				hint: {
					text: typeInfo.hint,
				}
			} );

			for( let [ fieldName, value ] of Object.entries( configItem.fields ) ){
				formFields[ fieldName ] = value;
			}
		}

		formFields.status = {
			type: Form.RADIO,
			values: [ currentStatus ],
			items,
			validators: [
				{
					fn: ( value ) => ( validators.isBarrierStatus( value ) && currentStatus !== value ),
					message: 'Choose a status'
				}
			]
		};

		const form = new Form( req, formFields );
		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/status/index', {
				...templateValues,
				statusTypes: statusMetadata.types,
				validTypes,
				pendingOther: metadata.barrier.status.pending.OTHER,
			} ),
			saveFormData: ( formValues ) => {

				const { serviceMethod, transformValues } = configItems[ formValues.status ];

				if( transformValues ){
					formValues = transformValues( formValues );
				}

				return backend.barriers.setStatus[ serviceMethod ]( req, req.barrier.id, formValues );
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
