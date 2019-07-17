const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const backend = require( '../../../lib/backend-service' );

module.exports = async ( req, res, next ) => {

	const report  = ( req.report || {} );
	const form = new Form( req, {

		country: {
			type: Form.SELECT,
			values: [ report.export_country],
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

			const formValues = form.getValues();

			if( !metadata.isCountryWithAdminArea( formValues.country ) ){

				try {

					const reportId = report.id;
					const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status } );
					const sessionResolvedForm = ( req.session.isResolvedFormValues || req.report && { isResolved: req.report.is_resolved, resolvedDate: req.report.resolved_date } );
					const isUpdate = !!reportId;

					let response;
					let body;
					let values = Object.assign( {}, sessionStartForm, sessionResolvedForm, formValues, { adminAreas: [] } );

					if( isUpdate ){
						({ response, body } = await backend.reports.update( req, reportId, values ));
					} else {
						({ response, body } = await backend.reports.save( req, values ));
					}

					if( response.isSuccess ){

						delete req.session.startFormValues;
						delete req.session.isResolvedFormValues;
						delete req.session.countryFormValues;

						if( !isUpdate && !body.id ){

							return next( new Error( 'No id created for report' ) );

						} else {

							return res.redirect( urls.reports.hasSectors( body.id ) );
						}

					} else {

						return next( new Error( `Unable to ${ isUpdate ? 'update' : 'save' } report, got ${ response.statusCode } response code` ) );
					}

				} catch( e ){

					return next( e );
				}

			} else {

				if( formValues.country !== report.export_country ){

					delete req.session.adminAreas;
				}

				return res.redirect( urls.reports.hasAdminAreas( report.id, formValues.country ) );
			}
		}
	}

	res.render( 'reports/views/country', form.getTemplateValues() );
};
