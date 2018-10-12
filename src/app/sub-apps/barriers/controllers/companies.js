const backend = require( '../../../lib/backend-service' );
const datahub = require( '../../../lib/datahub-service' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );

module.exports = {

	list: async ( req, res, next ) => {

		const barrier = req.barrier;

		if( !req.session.barrierCompanies ){
			req.session.barrierCompanies = ( barrier.companies || [] );
		}

		const companies = req.session.barrierCompanies;

		if( req.method === 'POST' ){

			const barrierId = barrier.id;

			delete req.session.barrierCompanies;

			try {

				const { response } = await backend.barriers.saveCompanies( req, barrierId, companies );

				if( response.isSuccess ){

					res.redirect( urls.barriers.detail( barrierId ) );

				} else {

					next( new Error( `Unable to save companies for barrier, got ${ response.statusCode } response code` ) );
				}

			} catch( e ){

				next( e );
			}

		} else {

			res.render( 'barriers/views/companies/list', {
				csrfToken: req.csrfToken(),
				companyList: companies
			} );
		}
	},

	search: async ( req, res, next ) => {

		let results;
		let error;
		const companies = ( req.session.barrierCompanies || req.barrier.companies );
		const form = new Form( req, {
			query: {
				required: 'Enter a company or organisation affect by the barrier'
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response, body } = await datahub.searchCompany( req, form.getValues().query, 1, 100 );

					if( response.isSuccess ){

						results = body;

					} else {

						switch( response.statusCode ){

							case 404:
								error = 'No company found';
							break;
							case 403:
								error = 'You do not have permission to search for a company, please contact Data Hub support.';
							break;
							default:
								error = 'There was an error finding the company';
						}
					}

				} catch( e ){

					next( e );
				}
			}
		}

		res.render( 'barriers/views/companies/search', Object.assign(
			form.getTemplateValues(),
			{ results, error, companies }
		) );
	},

	details: ( req, res ) => {

		if( req.method === 'POST' ){

			const { id, name } = req.company;
			const companies = req.session.barrierCompanies || [];

			if( !companies.find( ( company ) => company.id === id ) ){

				companies.push( { id, name } );
			}

			req.session.barrierCompanies = companies;
			res.redirect( urls.barriers.companies.list( req.barrier.id ) );

		} else {

			res.render( 'barriers/views/companies/details', { csrfToken: req.csrfToken() } );
		}
	},

	remove: ( req, res ) => {

		const { companyId } = req.body;
		const companies = req.session.barrierCompanies;

		req.session.barrierCompanies = companies.filter( ( { id } ) => companyId !== id );
		res.redirect( urls.barriers.companies.list( req.barrier.id ) );
	},
};
