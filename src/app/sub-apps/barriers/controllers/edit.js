const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const metadata = require( '../../../lib/metadata' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );
const backend = require( '../../../lib/backend-service' );
const urls = require( '../../../lib/urls' );

module.exports = {

	headlines: async ( req, res, next ) => {

		const barrier = req.barrier;

		const form = new Form( req, {
			title: {
				values: [ barrier.barrier_title ],
				required: 'Enter a title for this barrier'
			},
			country: {
				type: Form.SELECT,
				values: [ barrier.export_country ],
				items: metadata.getCountryList(),
				validators: [
					{
						fn: validators.isCountry,
						message: 'Select a location for this barrier'
					}
				]
			},
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/edit/headlines', templateValues ),
			saveFormData: ( formValues ) => backend.barriers.saveDetails( req, barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.detail( barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	product: async ( req, res, next ) => {

		const barrier = req.barrier;
		const form = new Form( req, {

			product: {
				values: [ barrier.product ],
				required: 'Enter a product or service'
			},
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/edit/product', templateValues ),
			saveFormData: ( formValues ) => backend.barriers.saveProduct( req, barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.detail( barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	description: async ( req, res, next ) => {

		const barrier = req.barrier;
		const form = new Form( req, {

			description: {
				values: [ barrier.problem_description ],
				required: 'Enter a brief description for this barrier'
			},
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/edit/description', templateValues ),
			saveFormData: ( formValues ) => backend.barriers.saveDescription( req, barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.detail( barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	source:  async ( req, res, next ) => {

		const barrier = req.barrier;
		const form = new Form( req, {
			source: {
				type: Form.RADIO,
				values: [ barrier.source ],
				items: govukItemsFromObj( metadata.barrierSource ),
				validators: [
					{
						fn: validators.isMetadata( 'barrierSource' ),
						message: 'Select how you became aware of the barrier'
					}
				]
			},

			sourceOther: {
				values: [ barrier.other_source ],
				conditional: { name: 'source', value: 'OTHER' },
				required: 'Enter how you became aware of the barrier'
			},
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/edit/source', templateValues ),
			saveFormData: ( formValues ) => backend.barriers.saveSource( req, barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.detail( barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	priority: async ( req, res, next ) => {

		const barrier = req.barrier;
		const form = new Form( req, {
			priority: {
				type: Form.RADIO,
				values: [ barrier.priority.code ],
				items: metadata.getBarrierPrioritiesList(),
				validators: [
					{
						fn: validators.isBarrierPriority,
						message: 'Select a barrier priority'
					}
				]
			},

			priorityDescription: {},
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/edit/priority', templateValues ),
			saveFormData: ( formValues ) => backend.barriers.savePriority( req, barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.detail( barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	}, 
	eu_exit_related: async ( req, res, next ) => {

		const barrier = req.barrier;
		const form = new Form( req, {
			eu_exit_related: {
				type: Form.RADIO,
				values: [ barrier.eu_exit_related ],
				items: [
					{
						value: true,
						text: "Yes"
					}, 
					{
						value: false,
						text: "No"
					}
				]
			}
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/edit/eu-exit-related', templateValues ),
			saveFormData: ( formValues ) => backend.barriers.saveEuExitRelated( req, barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.detail( barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	status: async ( req, res, next ) => {

		const barrier = req.barrier;

		const form = new Form( req, {
			status: {
				type: Form.RADIO,
				values: [ barrier.problem_status ],
				items: govukItemsFromObj( metadata.statusTypes ),
				validators: [{
					fn: validators.isMetadata( 'statusTypes' ),
					message: 'Select a barrier urgency'
				}]
			}
		} );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( 'barriers/views/edit/status', templateValues ),
			saveFormData: ( formValues ) => backend.barriers.saveStatus( req, barrier.id, formValues ),
			saved: () => res.redirect( urls.barriers.detail( barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},
};
