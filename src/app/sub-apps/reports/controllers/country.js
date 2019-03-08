const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );

module.exports = ( req, res ) => {

	const sessionValues = ( req.session.countryFormValues || {} );
	const report  = ( req.report || {} );
	const form = new Form( req, {

		country: {
			type: Form.SELECT,
			values: [ report.export_country, sessionValues.country ],
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
		delete req.session.countryFormValues;

		if( !form.hasErrors() ){

			req.session.countryFormValues = form.getValues();
			return res.redirect( urls.reports.hasState( report.id ) );
		}
	}

	res.render( 'reports/views/country', form.getTemplateValues() );
};
