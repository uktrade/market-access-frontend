const backend = require( '../../../lib/backend-service' );
const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const govukItemsFromObj = require( '../../../lib/govuk-items-from-object' );

module.exports = async ( req, res, next ) => {

	const report = req.report;
	const isResolved = report.is_resolved;
	const formConfig = {

		item: {
			values: [ report.product ],
			required: 'Enter a product or service'
		},

		barrierSource: {
			type: Form.RADIO,
			values: [ report.source ],
			items: govukItemsFromObj( metadata.barrierSource ),
			validators: [
				{
					fn: validators.isMetadata( 'barrierSource' ),
					message: 'Select how you became aware of the barrier'
				}
			]
		},

		barrierSourceOther: {
			values: [ report.other_source ],
			conditional: { name: 'barrierSource', value: 'OTHER' },
			required: 'Enter how you became aware of the barrier'
		},

		barrierTitle: {
			values: [ report.barrier_title ],
			required: 'Enter a title for this barrier'
		},

		euExitRelated: {
			values: [report.is_eu_exit],
			required: 'Please select whether this barrier is related to the EU Exit or not'
		},

		description: {
			values: [ report.problem_description ],
			required: 'Enter a brief description for this barrier'
		},
	};

	if( isResolved ){

		formConfig.resolvedDescription = {
			values: [ report.status_summary ],
			required: 'Enter an explanation of how you solved this barrier'
		};
	}

	const form = new Form( req, formConfig );

	const processor = new FormProcessor( {
		form,
		render: ( templateValues ) => {

			const hasSectors = ( report.sectors_affected === true );
			const urlMethod = ( hasSectors ? 'sectors' : 'hasSectors' );

			templateValues.backHref =  urls.reports[ urlMethod ]( report.id );
			templateValues.isResolved = isResolved;

			res.render( 'reports/views/about-problem', templateValues );
		},
		saveFormData: ( formValues ) => {

			if( form.isExit ){

				return backend.reports.saveProblem( req, report.id, formValues );

			} else {

				return backend.reports.saveProblemAndSubmit( req, report.id, formValues );
			}
		},
		saved: ( body ) => {

			const barrierId = body.id;

			if( form.isExit ){

				res.redirect( urls.reports.detail( barrierId ) );

			} else {

				req.flash( 'barrier-created', barrierId );
				res.redirect( urls.barriers.detail( barrierId ) );
			}
		}
	} );

	try {

		await processor.process();

	} catch( e ){

		next( e );
	}
};
