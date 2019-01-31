const backend = require( '../../../lib/backend-service' );
const Form = require( '../../../lib/Form' );
const FormProcessor = require( '../../../lib/FormProcessor' );
const urls = require( '../../../lib/urls' );

module.exports = async ( req, res, next ) => {

	const report = req.report;
	const isResolved = report.is_resolved;
	const formConfig = {
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

	} else {

		formConfig.nextSteps = {
			values: [ report.next_steps_summary ],
		};
	}

	const form = new Form( req, formConfig );

	const processor = new FormProcessor( {
		form,
		render: ( templateValues ) => {

			templateValues.backHref =  urls.reports.aboutProblem( report.id );
			templateValues.isResolved = isResolved;

			res.render( 'reports/views/summary', templateValues );
		},
		saveFormData: ( formValues ) => {

			if( form.isExit ){

				return backend.reports.saveSummary( req, report.id, formValues );

			} else {

				return backend.reports.saveSummaryAndSubmit( req, report.id, formValues );
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
