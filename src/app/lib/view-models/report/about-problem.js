const metadata = require( '../../metadata' );
const radioItemsFromObj = require( '../../radio-items-from-object' );

let lossScale;
let boolScale;
let countries;

function isChecked( formValue, sessionValue ){

	return ( item ) => {

		item.checked = ( formValue == item.value || sessionValue == item.value );

		return item;
	};
}

function selectItems( item ){

	return {
		value: item.id,
		text: item.name
	};
}

function isSelected( formValue, sessionValue ){

	return ( item ) => {

		if( formValue === item.value || sessionValue === item.value ){
			item.selected = true;
		}

		return item;
	};
}

module.exports = ( csrfToken, formValues = {}, sessionValues = {} ) => {

	if( !lossScale ){ lossScale = radioItemsFromObj( metadata.lossScale ); }
	if( !boolScale ){ boolScale = radioItemsFromObj( metadata.boolScale ); }
	if( !countries ){

		countries = metadata.countries.map( selectItems );
		countries.unshift( { value: '', text: 'Please choose a country' } );
	}

	return {
		csrfToken,
		losses: lossScale.map( isChecked( formValues.losses, sessionValues.losses ) ),
		otherCompanies: boolScale.map( isChecked( formValues.otherCompanies, sessionValues.otherCompanies ) ),
		countries: countries.map( isSelected( formValues.country, sessionValues.country ) )
	};
};
