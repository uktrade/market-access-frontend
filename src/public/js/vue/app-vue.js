const Vue = require( 'vue' ).default;
const Typeahead = require( './typeahead.vue' ).default;
const { highlight } = require( './filters' );

Vue.filter( 'highlight', highlight );

const vueWrappers = Array.from( document.querySelectorAll( '.js-vue-typeahead' ) );

function getOptions( parent ){

	const formGroup = parent.querySelector( '.govuk-form-group' );
	const inputs = formGroup.querySelectorAll( 'input' );
	const data = [];

	for( let input of Array.from( inputs ) ){

		if( input.value === '' ){ continue; }

		data.push( { value: input.value, text: input.nextElementSibling.innerText, selected: input.checked } );
	}

	parent.removeChild( formGroup );

	return data;
}

vueWrappers.forEach( ( wrapper ) => {

	new Vue({
		el: wrapper,
		components: {
			'typeahead': Typeahead,
		},
		data: {
			defaultOptions: getOptions( wrapper ),
		},
	});
});
