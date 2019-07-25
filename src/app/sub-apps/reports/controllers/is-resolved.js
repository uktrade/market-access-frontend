const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const getDateParts = require( '../../../lib/get-date-parts' );
const barrierFields = require( '../../../lib/barrier-fields' );

const { PART_RESOLVED, RESOLVED } = metadata.barrier.status.types;
const FALSE = 'false';

function createDate( value, ...args ){

	const field = barrierFields.createStatusDate( ...args );

	field.conditional = { name: 'isResolved', value };
	field.errorField = 'resolved_date';

	return field;
}

module.exports = ( req, res ) => {

	const report  = ( req.report || {} );
	const reportDate = ( getDateParts( report.resolved_date ) || {} );
	const sessionValues = ( req.session.isResolvedFormValues || {} );
	const isResolvedValue = ( sessionValues.isResolved || report.is_resolved && report.resolved_status );
	const isResolved = ( isResolvedValue == RESOLVED );
	const isPartiallyResolved = ( isResolvedValue == PART_RESOLVED );
	const form = new Form( req, {

		isResolved: {
			type: Form.RADIO,
			values: [ isResolvedValue ],
			items: [
				{
					text: 'Yes, fully',
					value: RESOLVED,
				},{
					text: 'Yes, partially',
					value: PART_RESOLVED,
				},{
					text: 'No',
					value: FALSE,
				},
			],
			validators: [{
				fn: ( value ) => ( value == RESOLVED || value == PART_RESOLVED || value == FALSE ),
				message: 'Select if the barrier is fully resolved, partially resolved or not resolved'
			}]
		},

		resolvedDate: createDate( RESOLVED, ( isResolved ? ( sessionValues.resolvedDate || reportDate ) : {} ) ),
		partResolvedDate: createDate( PART_RESOLVED, ( isPartiallyResolved ? ( sessionValues.partResolvedDate || { partMonth: reportDate.month, partYear: reportDate.year } ) : {} ), 'partMonth', 'partYear' ),
	} );

	if( form.isPost ){

		form.validate();
		delete req.session.isResolvedFormValues;

		if( !form.hasErrors() ){

			req.session.isResolvedFormValues = form.getValues();
			return res.redirect( urls.reports.country( report.id ) );
		}
	}

	res.render( 'reports/views/is-resolved', {
		...form.getTemplateValues(),
		types: {
			RESOLVED,
			PART_RESOLVED,
		}
	} );
};
