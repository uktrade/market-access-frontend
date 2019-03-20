const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

module.exports = async ( req, res, next ) => {

    const report  = ( req.report || {} );
    const countryId = req.params.countryId;
    const isSameCountry = report.export_country == countryId;
    const hasAdminAreasInReport = report.country_admin_areas && report.country_admin_areas.length > 0;
    const alreadyContainsStates = isSameCountry && hasAdminAreasInReport ? "false": null

    const boolItems = govukItemsFromObj( metadata.bool );
	const items = boolItems.map( ( item ) => item.value === 'false' ? { value: item.value, text: 'No - just part of the country' } : item );
	const form = new Form( req, {
        hasAdminAreas: {
			type: Form.RADIO,
            items,
            values: [ alreadyContainsStates ],
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
            if (form.getValues().hasAdminAreas === "true") {
                try {
                    const reportId = report.id;
                    const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status } );
                    const sessionResolvedForm = ( req.session.isResolvedFormValues || req.report && { isResolved: req.report.is_resolved, resolvedDate: req.report.resolved_date } );
                    
                    const isUpdate = !!reportId;
            
                    let response;
                    let body;
                    let values = Object.assign( {}, sessionStartForm, sessionResolvedForm, {country: countryId}, {country_admin_areas: []}  );
    
                    if( isUpdate ){
                        ({ response, body } = await backend.reports.update( req, reportId, values ));
                    } else {
                        ({ response, body } = await backend.reports.save( req, values ));
                    }
            
                    if( response.isSuccess ){
            
                        delete req.session.startFormValues;
                        delete req.session.isResolvedFormValues;
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
                delete req.session.adminAreas;
                
                if (isSameCountry && hasAdminAreasInReport ) {
                    req.session.adminAreas = report.country_admin_areas;
                }
                
                const adminAreasList = req.session.adminAreas;
                const hasListOfAdminAreas = ( Array.isArray( adminAreasList ) && adminAreasList.length > 0 );
                const urlMethod = hasListOfAdminAreas ? 'adminAreas' : 'addAdminArea';
                        
                return res.redirect( urls.reports[ urlMethod ]( report.id, countryId ));
            }
		}
    }

	res.render( 'reports/views/has-admin-areas', {countryId, ...form.getTemplateValues()} );
};
