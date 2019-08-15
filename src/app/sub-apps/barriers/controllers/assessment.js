const metadata = require( '../../../lib/metadata' );
const backend = require( '../../../lib/backend-service' );
const urls = require( '../../../lib/urls' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObject = require( '../../../lib/govuk-items-from-object' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );
const detailViewModel = require( '../view-models/detail' );

function createValueController( opts ){

	return async ( req, res, next ) => {

		const form = new Form( req, {
			value: {
				required: 'Enter a value',
				validators: [{
					fn: validators.isNumeric,
					message: 'Value is not a number'
				}]
			}
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( `barriers/views/assessment/${ opts.template }`, templateValues ),
			saveFormData: ( formValues ) => backend.barriers.assessment[ opts.serviceMethod ]( req, req.barrier.id, formValues.value ),
			saved: () => res.redirect( urls.barriers.assessment.detail( req.barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	};
}

module.exports = {

	list: async( req, res, next ) => {

		try {

			const { response, body } = await backend.barriers.assessment.get( req, req.barrier.id );

			if( response.isSuccess ){

				res.render( 'barriers/views/assessment/detail', {
					...detailViewModel( req.barrier ),
					assessment: body,
					impactScale: Object.entries( metadata.barrierAssessmentImpactOptions ).map( ( [ key, text ] ) => ({
						isActive: ( key === body.impact ),
						text,
					}) )
				} );

			} else if( response.statusCode === 404 ){

				res.render( 'barriers/views/assessment/detail', {
					...detailViewModel( req.barrier ),
				} );

			} else {

				throw new HttpResponseError( 'Unable to get barrier assessment', response, body );
			}

		} catch( e ){

			next( e );
		}
	},

	economic: async ( req, res, next ) => {

		const form = new Form( req, {
			impact: {
				type: Form.RADIO,
				required: 'Select an economic impact',
				items: govukItemsFromObject( metadata.barrierAssessmentImpactOptions ),
			},
			description: {
				required: 'Explain the assessment'
			}
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/assessment/economic', templateValues ),
			saveFormData: ( formValues ) => backend.barriers.assessment.create( req, req.barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.assessment.detail( req.barrier.id ) )
		} );

		try {

			await processor.process({ checkResponseErrors: true });

		} catch( e ){

			next( e );
		}
	},

	economyValue: createValueController({
		template: 'economy-value',
		serviceMethod: 'saveEconomyValue',
	}),

	marketSize: createValueController({
		template: 'market-size',
		serviceMethod: 'saveMarketSize',
	}),

	exportValue: createValueController({
		template: 'export-value',
		serviceMethod: 'saveExportValue',
	}),

	commercialValue: createValueController({
		template: 'commercial-value',
		serviceMethod: 'saveCommercialValue',
	}),
};
