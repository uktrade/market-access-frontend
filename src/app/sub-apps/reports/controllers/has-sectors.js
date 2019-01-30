const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

module.exports = async ( req, res, next ) => {

	const boolItems = govukItemsFromObj( metadata.bool );
	const items = boolItems.map( ( item ) => item.value === 'false' ? { value: item.value, text: 'No, I don\'t know at the moment' } : item );
	const report = req.report;
	const form = new Form( req, {

		hasSectors: {
			type: Form.RADIO,
			items,
			values: [ report.sectors_affected ],
			validators: [ {
				fn: validators.isMetadata( 'bool' ),
				message: 'Select if you are aware of a sector affected by the barrier'
			} ]
		}
	} );

	function getRedirectUrl(){

		const { hasSectors } = form.getValues();
		const sectorsList = ( report.sectors || req.session.sectors );
		const hasListOfSectors = ( Array.isArray( sectorsList ) && sectorsList.length > 0 );
		const urlMethod = ( hasSectors === 'true' ? ( hasListOfSectors ? 'sectors' : 'addSector' ) : 'aboutProblem' );

		return urls.reports[ urlMethod ]( report.id );
	}

	const processor = new FormProcessor( {
		form,
		render: ( templateValues ) => res.render( 'reports/views/has-sectors', templateValues ),
		saveFormData: ( formValues ) => backend.reports.saveHasSectors( req, report.id, formValues ),
		saved: () => res.redirect( form.isExit ? urls.reports.detail( report.id ) : getRedirectUrl() )
	} );

	try {

		await processor.process();

	} catch( e ){

		next( e );
	}
};
