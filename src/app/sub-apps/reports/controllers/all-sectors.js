const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

module.exports = async ( req, res, next ) => {

	const boolItems = govukItemsFromObj( metadata.bool );
	const items = boolItems.map( 
        ( item ) => item.value === 'true' ? 
        { value: item.value, text: 'All sectors' } : 
        { value: item.value, text: 'Just some sectors' } );
	const report = req.report;
	const form = new Form( req, {

		allSectors: {
			type: Form.RADIO,
			items,
			values: [ report.all_sectors ],
			validators: [ {
				fn: validators.isMetadata( 'bool' ),
				message: 'Select if the barrier affect all sectors, or just some sectors'
			} ]
		}
	} );

	function getRedirectUrl(){

		const { allSectors } = form.getValues();
		const sectorsList = ( report.sectors || req.session.sectors );
		const hasListOfSectors = ( Array.isArray( sectorsList ) && sectorsList.length > 0 );
		const urlMethod = ( allSectors === 'false' ? ( hasListOfSectors ? 'sectors' : 'addSector' ) : 'aboutProblem' );

		return urls.reports[ urlMethod ]( report.id );
	}

	const processor = new FormProcessor( {
		form,
        render: ( templateValues ) => res.render( 'reports/views/all-sectors', templateValues ),
		saveFormData: ( formValues ) => backend.reports.saveAllSectors( req, report.id, formValues ),
		saved: () => res.redirect( form.isExit ? urls.reports.detail( report.id ) : getRedirectUrl() )
	} );

	try {

		await processor.process();

	} catch( e ){

		next( e );
	}
};