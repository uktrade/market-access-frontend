const metadata = require( '../../../lib/metadata' );
const backend = require( '../../../lib/backend-service' );
const urls = require( '../../../lib/urls' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObject = require( '../../../lib/govuk-items-from-object' );
const barrierDetailViewModel = require( '../view-models/detail' );
const documentControllers = require( '../../../lib/document-controllers' );
const economicViewModel = require( '../view-models/assessment/economic' );
const fileSize = require( '../../../lib/file-size' );
const uploadDocument = require( '../../../lib/upload-document' );

function createValueController( { template, serviceMethod, valueProp } ){

	return async ( req, res, next ) => {

		const assessment = req.assessment;
		const formConfig = {
			value: {
				required: 'Enter a value',
				validators: [{
					fn: validators.isNumeric,
					message: 'Enter a whole number'
				}],
				sanitize: ( value ) => value.replace( /,/g, '' ),
			}
		};

		if( assessment ){
			formConfig.value.values = [ assessment[ valueProp ] ];
		}

		const form = new Form( req, formConfig );

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render( `barriers/views/assessment/${ template }`, templateValues ),
			saveFormData: ( formValues ) => backend.barriers.assessment[ serviceMethod ]( req, req.barrier, formValues.value ),
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

	detail: ( req, res ) => {

		const assessment = req.assessment;

		if( assessment ){

			res.render( 'barriers/views/assessment/detail', {
				...barrierDetailViewModel( req.barrier ),
				assessment,
				impact: {
					text: metadata.barrierAssessmentImpactOptions[ assessment.impact ],
					id: assessment.impact,
				},
				documents: ( assessment.documents && req.assessment.documents.map( getDocument ) ),
			} );

		} else {

			res.render( 'barriers/views/assessment/detail', barrierDetailViewModel( req.barrier ) );
		}
	},

	economic: async ( req, res, next ) => {

		const barrierId = req.barrier.id;
		const assessment = req.assessment;
		const session  = req.barrierSession.documents.assessment;

		const formConfig = {
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
		};

		if( assessment ){

			formConfig.impact.values = [ assessment.impact ];
			formConfig.description.values = [ assessment.explanation ];

			if( assessment.documents ){
				session.setIfNotAlready( assessment.documents );
			}
		}

		const form = new Form( req, formConfig );

		if( req.formError && validators.isFileOverSize( req.formError ) ){

			form.addErrors( { document: documentControllers.OVERSIZE_FILE_MESSAGE } );
		}

		const processor = new FormProcessor( {
			form,
			render: ( templateValues ) => res.render(
				'barriers/views/assessment/economic',
				{
					documents: assessment.documents,
					...economicViewModel( barrierId, session.get(), templateValues )
				}
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
			saved: () => {

				session.delete();
				res.redirect( urls.barriers.assessment.detail( barrierId ) );
			}
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

		delete: documentControllers.delete(
			( req ) => req.params.id,
			( req ) => urls.barriers.assessment.economic( req.uuid, req.params.id ),
			( req, documentId ) => {

				const session = req.barrierSession.documents.assessment;
				const documents = session.get();

				if( documents && documents.length ){

					session.set( documents.filter( ( document ) => document.id !== documentId ) );
				}
			}
		),

		cancel: ( req, res ) => {

			const barrierId = req.uuid;

			req.barrierSession.documents.assessment.delete();
			res.redirect( urls.barriers.assessment.detail( barrierId ) );
		}
	},

	economyValue: createValueController({
		template: 'economy-value',
		serviceMethod: 'saveEconomyValue',
		valueProp: 'value_to_economy'
	}),

	marketSize: createValueController({
		template: 'market-size',
		serviceMethod: 'saveMarketSize',
		valueProp: 'import_market_size',
	}),

	exportValue: createValueController({
		template: 'export-value',
		serviceMethod: 'saveExportValue',
		valueProp: 'export_value',
	}),

	commercialValue: createValueController({
		template: 'commercial-value',
		serviceMethod: 'saveCommercialValue',
		valueProp: 'commercial_value',
	}),
};
