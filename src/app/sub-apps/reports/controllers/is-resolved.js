const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const getDateParts = require( '../../../lib/get-date-parts' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

module.exports = ( req, res ) => {

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
};
