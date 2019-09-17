const backend = require( '../../../lib/backend-service' );
const datahub = require( '../../../lib/datahub-service' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

const LIST_TEMPLATE = 'barriers/views/companies/list';

async function search( req, res, next ){

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

				const { response, body } = await datahub.searchCompany( form.getValues().query, 1, 100 );

				if( response.isSuccess ){

					results = body;

				} else {

					switch( response.statusCode ){

						case 404:
							error = 'No company found';
							break;
						default:
							error = 'There was an error finding the company';
					}
				}

			} catch( e ){

				return next( e );
			}
		}
	}

	res.render( 'barriers/views/companies/search', Object.assign(
		form.getTemplateValues(),
		{ results, error, companies }
	) );
}

module.exports = {

	edit: ( req, res ) => {

		req.session.barrierCompanies = ( req.barrier.companies || [] );

		res.render( LIST_TEMPLATE, {
			csrfToken: req.csrfToken(),
			companyList: req.session.barrierCompanies
		} );
	},

	new: ( req, res, next ) => {

		req.session.barrierCompanies = [];

		search( req, res, next );
	},

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

				const { response, body } = await backend.barriers.saveCompanies( req, barrierId, companies );

				if( response.isSuccess ){

					res.redirect( urls.barriers.detail( barrierId ) );

				} else {

					next( new HttpResponseError( 'Unable to save companies for barrier', response, body ) );
				}

			} catch( e ){

				next( e );
			}

		} else {

			res.render( LIST_TEMPLATE, {
				csrfToken: req.csrfToken(),
				companyList: companies
			} );
		}
	},

	search,

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
