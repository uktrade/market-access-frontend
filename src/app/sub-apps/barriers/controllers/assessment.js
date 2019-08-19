const metadata = require( '../../../lib/metadata' );
const backend = require( '../../../lib/backend-service' );
const urls = require( '../../../lib/urls' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObject = require( '../../../lib/govuk-items-from-object' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );
const barrierDetailViewModel = require( '../view-models/detail' );
const documentControllers = require( '../../../lib/document-controllers' );
const economicViewModel = require( '../view-models/assessment/economic' );
const fileSize = require( '../../../lib/file-size' );
const uploadDocument = require( '../../../lib/upload-document' );

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
			saveFormData: ( formValues ) => backend.barriers.assessment[ opts.serviceMethod ]( req, req.barrier, formValues.value ),
			saved: () => res.redirect( urls.barriers.assessment.detail( req.barrier.id ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	};
}

function getDocument( doc ){

	return {
		id: doc.id,
		name: doc.name,
		size: fileSize( doc.size ),
		canDownload: ( doc.status === 'virus_scanned' ),
		status: metadata.documentStatus[ doc.status ]
	};
}

module.exports = {

	detail: async( req, res, next ) => {

		try {

			const { response, body } = await backend.barriers.assessment.get( req, req.barrier.id );

			if( response.isSuccess ){

				res.render( 'barriers/views/assessment/detail', {
					...barrierDetailViewModel( req.barrier ),
					assessment: body,
					impact: {
						text: metadata.barrierAssessmentImpactOptions[ body.impact ],
						id: body.impact,
					},
					documents: ( body.documents && body.documents.map( getDocument ) ),
				} );

			} else if( response.statusCode === 404 ){

				res.render( 'barriers/views/assessment/detail', barrierDetailViewModel( req.barrier ) );

			} else {

				throw new HttpResponseError( 'Unable to get barrier assessment', response, body );
			}

		} catch( e ){

			next( e );
		}
	},

	economic: async ( req, res, next ) => {

		const barrierId = req.barrier.id;
		const session  = req.barrierSession.documents.assessment;
		const form = new Form( req, {
			impact: {
				type: Form.RADIO,
				required: 'Select an economic impact',
				items: govukItemsFromObject( metadata.barrierAssessmentImpactOptions ),
			},
			description: {
				required: 'Explain the assessment'
			},
			document: {
				type: Form.FILE,
				validators: [
					{
						fn: ( file ) => {

							const isValid = validators.isValidFile( file );

							if( !isValid ){

								documentControllers.reportInvalidFile( file );
							}

							return isValid;
						},
						message: documentControllers.INVALID_FILE_TYPE_MESSAGE
					}
				]
			}
		} );

		if( req.formError && validators.isFileOverSize( req.formError ) ){

			form.addErrors( { document: documentControllers.OVERSIZE_FILE_MESSAGE } );
		}

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render(
				'barriers/views/assessment/economic',
				economicViewModel( barrierId, session.get(), templateValues )
			),
			saveFormData: async ( formValues ) => {

				const documents = session.get();
				const values = {
					impact: formValues.impact,
					description: formValues.description,
					documentIds: [],
				};

				if( documents ){

					values.documentIds = documents.map( ( document ) => document.id );
				}

				if( formValues.document && formValues.document.size > 0 ){

					try {

						const id = await uploadDocument( req, formValues.document );
						const { passed } = await backend.documents.getScanStatus( req, id );

						if( passed ){

							values.documentIds.push( id );

						} else {

							throw new Error( documentControllers.FILE_INFECTED_MESSAGE );
						}

					} catch ( e ){

						return next( e );
					}
				}

				return backend.barriers.assessment.saveEconomic( req, req.barrier, values );
			},
			saved: () => res.redirect( urls.barriers.assessment.detail( barrierId ) )
		} );

		try {

			await processor.process();

		} catch( e ){

			next( e );
		}
	},

	documents: {
		add: documentControllers.xhr.add( ( req, document ) => {

			const session = req.barrierSession.documents.assessment;

			session.setIfNotAlready( [] );
			session.get().push( document );
		} ),

		delete: documentControllers.xhr.delete( ( req ) => req.params.id, ( req, documentId ) => {

			const session = req.barrierSession.documents.assessment;
			const documents = session.get();

			if( documents && documents.length ){

				session.set( documents.filter( ( document ) => document.id !== documentId ) );
			}
		} ),

		cancel: ( req, res ) => {

			const barrierId = req.uuid;

			req.barrierSession.documents.assessment.delete();
			res.redirect( urls.barriers.assessment.detail( barrierId ) );
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
