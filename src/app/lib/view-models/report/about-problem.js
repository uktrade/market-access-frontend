const metadata = require( '../../metadata' );
const radioItemsFromObj = require( '../../radio-items-from-object' );

let lossScale;
let boolScale;
let countries;

function isChecked( formValue ){

	return ( item ) => {

		// overwrite property so we don't have to make new objecs
		item.checked = ( formValue == item.value );

		return item;
	};
}

function selectItems( item ){

	return {
		value: item.id,
		text: item.name
	};
}

function isSelected( formValue ){

	return ( item ) => {

		// overwrite property so we don't have to make new objecs
		item.selected = ( !!item.value && formValue == item.value );

		return item;
	};
}

module.exports = ( csrfToken, report = {}, formValues = {} ) => {

	if( !lossScale ){ lossScale = radioItemsFromObj( metadata.lossScale ); }
	if( !boolScale ){ boolScale = radioItemsFromObj( metadata.boolScale ); }
	if( !countries ){

		countries = metadata.countries.map( selectItems );
		countries.unshift( { value: '', text: 'Please choose a country' } );
	}

	return {
		csrfToken,
		item: formValues.item || report.product,
		commodityCode: formValues.commodityCode || ( report.commodity_codes && report.commodity_codes.join( ', ' ) ),
		countries: countries.map( isSelected( formValues.country || report.export_country ) ),
		description: formValues.description || report.problem_description,
		impact: formValues.impact || report.problem_impact,
		losses: lossScale.map( isChecked( formValues.losses || report.estimated_loss_range ) ),
		otherCompanies: boolScale.map( isChecked( formValues.otherCompanies || report.other_companies_affected ) )
	};
};
