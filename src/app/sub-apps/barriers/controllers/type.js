const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const metadata = require( '../../../lib/metadata' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

function barrierTypeToRadio( item ){

	const { id, title, category, description } = item;

	return {
		value: id,
		text: title,
		category,
		conditional: { html: `<div class="conditional-barrier-type-content">${ description.replace( '\n', '<br>' ) }</div>` }
	};
}

function isBarrierTypeCategory( category ){

	return ( item ) => item.category === category;
}

module.exports = {

	list: async ( req, res, next ) => {

		const category = req.category;
		const barrier = req.barrier;
		const typeId = ( barrier.barrier_type && barrier.barrier_type.id );
		const items = metadata.barrierTypes.filter( isBarrierTypeCategory( category ) ).map( barrierTypeToRadio );
		const form = new Form( req, {
			barrierType: {
				type: Form.RADIO,
				items,
				values: [ typeId ],
				validators: [ {
					fn: validators.isBarrierType,
					message: 'Select a barrier type'
				} ]
			}
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => {

				templateValues.title = metadata.barrierTypeCategories[ category ];
				templateValues.category = category;

				res.render( 'barriers/views/type/list', templateValues );
			},
			saveFormData: ( formValues ) => backend.barriers.saveType( req, barrier.id, formValues, category ),
			saved: () => {

				delete req.session.typeCategoryValues;
				res.redirect( urls.barriers.detail( barrier.id ) );
			}
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	category: ( req, res ) => {

		const barrierId = req.barrier.id;
		const category = ( req.barrier.barrier_type && req.barrier.barrier_type.category );
		const form = new Form( req, {
			category: {
				type: Form.RADIO,
				values: ( category ? [ category ] : [] ),
				items: govukItemsFromObj( metadata.barrierTypeCategories ),
				validators: [ {
					fn: validators.isMetadata( 'barrierTypeCategories' ),
					message: 'Choose a barrier type category'
				} ]
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				const category = form.getValues().category;
				return res.redirect( urls.barriers.type.list( barrierId, category ) );
			}
		}

		res.render( 'barriers/views/type/category', form.getTemplateValues() );
	}
};
