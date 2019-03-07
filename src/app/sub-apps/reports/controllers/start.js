const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

module.exports = ( req, res ) => {

	const sessionValues = ( req.session.startFormValues || {} );
	const report  = ( req.report || {} );
	const form = new Form( req, {

		status: {
			type: Form.RADIO,
			values: [ sessionValues.status, report.problem_status ],
			items: govukItemsFromObj( metadata.statusTypes ),
			validators: [{
				fn: validators.isMetadata( 'statusTypes' ),
				message: 'Select a barrier scope'
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
};
