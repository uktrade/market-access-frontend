const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

module.exports = async ( req, res, next ) => {

    const report  = ( req.report || {} );
    const sessionValues = ( req.session.adminAreasFormValues || {} );

    const boolItems = govukItemsFromObj( metadata.bool );
	const items = boolItems.map( ( item ) => item.value === 'false' ? { value: item.value, text: 'No - just part of the country' } : item );

	const form = new Form( req, {
        hasAdminAreas: {
			type: Form.RADIO,
            items,
            values: [ report.country_admin_areas, sessionValues.adminAreas ],
			validators: [ {
				fn: validators.isMetadata( 'bool' ),
				message: 'Does it affect the entire country?'
			} ]
		}
    } );

    if( form.isPost ){

        form.validate();
        console.log(form.errors);
		if( !form.hasErrors() ){
            console.log("Thing", typeof(form.getValues().hasAdminAreas));
            if (form.getValues().hasAdminAreas) {
                try {
                    const reportId = report.id;
                    const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status } );
                    const sessionResolvedForm = ( req.session.isResolvedFormValues || req.report && { isResolved: req.report.is_resolved, resolvedDate: req.report.resolved_date } );
                    const sessionCountryForm = ( req.session.countryFormValues || req.report && { country: req.report.export_country } );
                    
                    const isUpdate = !!reportId;
            
                    let response;
                    let body;
                    let values = Object.assign( {}, sessionStartForm, sessionResolvedForm, sessionCountryForm, {country_admin_areas: []}  );
    
                    if( isUpdate ){
                        ({ response, body } = await backend.reports.update( req, reportId, values ));
                    } else {
                        ({ response, body } = await backend.reports.save( req, values ));
                    }
            
                    if( response.isSuccess ){
            
                        delete req.session.startFormValues;
                        delete req.session.isResolvedFormValues;
                        delete req.session.countryFormValues;
                        delete req.session.adminAreas;
            
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
