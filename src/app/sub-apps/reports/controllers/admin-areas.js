const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );

module.exports = {
	list: async ( req, res, next ) => {

		const report = req.report;
		const isPost = req.method === 'POST';
		
		if( !req.session.adminAreas ){
			req.session.adminAreas = ( report.country_admin_areas || [] );
		}

		const adminAreas = req.session.adminAreas;

		if( isPost ){
            console.log("trying to post");
			if( adminAreas && adminAreas.length ){

                try {
                    const reportId = report.id;
                    const sessionStartForm = ( req.session.startFormValues || req.report && { status: req.report.problem_status } );
                    const sessionResolvedForm = ( req.session.isResolvedFormValues || req.report && { isResolved: req.report.is_resolved, resolvedDate: req.report.resolved_date } );
                    const sessionCountryForm = ( req.session.countryFormValues || req.report && { country: req.report.country});
                    const isUpdate = !!reportId;
            
                    let response;
                    let body;
                    let values = Object.assign( {}, sessionStartForm, sessionResolvedForm, sessionCountryForm, {adminAreas});

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
			}
		}

		res.render( 'reports/views/admin-areas', { adminAreas: adminAreas.map( metadata.getAdminArea ), csrfToken: req.csrfToken() } );
    },
    remove: ( req, res ) => {

		const adminAreaToRemove = req.body.adminArea;

		req.session.adminAreas = req.session.adminAreas.filter( ( adminArea ) => adminArea !== adminAreaToRemove );

		res.redirect( urls.reports.adminAreas( req.report.id ) );
    },
    add: ( req, res ) => {

        const report = req.report;
        const sessionCountryForm = ( req.session.countryFormValues || req.report && { country: req.report.country});

        if( !req.session.adminAreas ){

			req.session.adminAreas = ( report.adminAreas || [] );
		}

		const adminAreas = req.session.adminAreas;
		const form = new Form( req, {

			adminAreas: {
				type: Form.SELECT,
				items: metadata.getCountryAdminAreasList(sessionCountryForm.country).filter( ( adminArea ) => !adminAreas.includes( adminArea.value ) ),
				validators: [ {
					fn: validators.isCountryAdminArea,
					message: 'Select an admin area affected by the barrier'
				},{
					fn: ( value ) => !adminAreas.includes( value ),
					message: 'Admin area already added, choose another'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				adminAreas.push( form.getValues().adminAreas );
				req.session.adminAreas = adminAreas;

				return res.redirect( urls.reports.adminAreas( report.id ) );
			}
		}

		res.render( 'reports/views/add-admin-area', Object.assign( form.getTemplateValues(), { currentAdminAreas: adminAreas.map( metadata.getAdminArea ) } ) );
	},
};
