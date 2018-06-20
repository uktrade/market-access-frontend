const metadata = require( '../../metadata' );
const radioItemsFromObj = require( '../../radio-items-from-object' );

let lossScale;
let boolScale;
let countries;

function isChecked( formValue ){

	return ( item ) => {

		// overwrite property so we don't have to make new objecs
		item.checked = ( formValue === item.value );

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
		item.selected = ( !!item.value && formValue === item.value );

		return item;
	};
}

module.exports = ( csrfToken, formValues = {} ) => {

	if( !lossScale ){ lossScale = radioItemsFromObj( metadata.lossScale ); }
	if( !boolScale ){ boolScale = radioItemsFromObj( metadata.boolScale ); }
	if( !countries ){

		countries = metadata.countries.map( selectItems );
		countries.unshift( { value: '', text: 'Please choose a country' } );
	}

	return {
		csrfToken,
		item: formValues.item,
		commodityCode: formValues.commodityCode,
		description: formValues.description,
		impact: formValues.impact,
		losses: lossScale.map( isChecked( formValues.losses ) ),
		otherCompanies: boolScale.map( isChecked( formValues.otherCompanies ) ),
		countries: countries.map( isSelected( formValues.country ) )
	};
};
