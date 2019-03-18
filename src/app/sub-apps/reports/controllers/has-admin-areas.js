const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

module.exports = async ( req, res, next ) => {

    const countryFormValue = ( req.session.countryFormValues || req.report && { country: req.report.country } );
    const report  = ( req.report || {} );

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
        hasAdminAreas: {
			type: Form.RADIO,
			items: govukItemsFromObj( metadata.adminAreaOptions ),
			validators: [ {
				fn: validators.isMetadata( 'adminAreaOptions' ),
				message: 'Does it affect the entire location or individual states/regions?'
			} ]
		}
    } );

    if( form.isPost ){

        form.validate();
        
		if( !form.hasErrors() ){
            if (form.getValues().hasAdminAreas == '1') {
                try {
                    const reportId = report.id;
                    const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status } );
                    const sessionResolvedForm = ( req.session.isResolvedFormValues || req.report && { isResolved: req.report.is_resolved, resolvedDate: req.report.resolved_date } );
                    const isUpdate = !!reportId;
            
                    let response;
                    let body;
                    let values = Object.assign( {}, sessionStartForm, sessionResolvedForm, countryFormValue, {country_admin_areas: []}  );
    
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

                const adminAreasList = ( report.country_admin_areas || req.session.adminAreas );
                const hasListOfAdminAreas = ( Array.isArray( adminAreasList ) && adminAreasList.length > 0 );
                const urlMethod = hasListOfAdminAreas ? 'adminAreas' : 'addAdminArea';
                        
                return res.redirect( urls.reports[ urlMethod ]( report.id ));
            }
		}
    }

	res.render( 'reports/views/has-admin-areas', form.getTemplateValues() );
};
