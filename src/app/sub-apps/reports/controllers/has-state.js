const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );

module.exports = async ( req, res, next ) => {

    const countryFormValue = ( req.session.countryFormValues || req.report && { country: req.report.country } );
    const report  = ( req.report || {} );
    
    if (!metadata.isCountryWithAdminArea(countryFormValue.country)){
        await saveData(req, report, next, false);
    }

	const form = new Form( req, {

        country: {
			type: Form.SELECT,
			values: [ countryFormValue.country ],
			items: metadata.getCountryList(),
			validators: [
				{
					fn: validators.isCountry,
					message: 'Select a location for this barrier'
				}
			]
		},

		countryAdminArea: {
			type: Form.SELECT,
			values: [ report.country_admin_area ],
			items: metadata.getCountryAdminAreasList(countryFormValue.country),
			validators: [
				{
					fn: validators.isCountryAdminArea,
					message: 'Select a state for this barrier'
				}
			]
		},
    } );

    if( form.isPost ){

		form.validate();

		if( !form.hasErrors() ){
            saveData(req, report, next, true);
		}
    }
    
    async function saveData(req, report, next, withState){
        try {
            const reportId = report.id;
            const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status } );
            const sessionResolvedForm = ( req.session.isResolvedFormValues || req.report && { isResolved: req.report.is_resolved, resolvedDate: req.report.resolved_date } );
            const isUpdate = !!reportId;

            let response;
            let body;
            let values = Object.assign( {}, sessionStartForm, sessionResolvedForm, countryFormValue );
            
            if (withState) {
                values.assign(form.getValues());
            }
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

	res.render( 'reports/views/has-state', form.getTemplateValues() );
};
