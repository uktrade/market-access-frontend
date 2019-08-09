const Form = require( '../../../lib/Form' );
const sso = require( '../../../lib/sso-api-service' );
const backend = require( '../../../lib/backend-service' );
const urls = require( '../../../lib/urls' );
const reporter = require( '../../../lib/reporter' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );
const detailViewModel = require( '../view-models/detail' );

function createMemberForTemplate( user ){

	return {
		id: user.user_id,
		name: `${ user.first_name } ${ user.last_name }`,
		email: user.email,
	};
}

module.exports = {

	list: async ( req, res ) => {

		res.render( 'barriers/views/team/list', detailViewModel( req.barrier ) );
	},

	add: async function( req, res, next ){

		let error;
		let member;

		const barrierId = req.barrier.id;
		const memberId = req.query.user;

		if( memberId ){

			try {

				const { response, body } = await backend.getSsoUser( req, memberId );

				if( response.isSuccess ){

					member = createMemberForTemplate( body );

				} else {

					throw new HttpResponseError( 'Error finding the user', response, body );
				}

			} catch( e ){

				return next( e );
			}
		}

		const form = new Form( req, {
			memberId: ( memberId ? {} : {
				required: 'Select a user to add',
			} ),
			role: {
				required: 'Enter a role'
			}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				try {

					const { response } = await backend.barriers.team.add( req, barrierId, form.getValues() );

					if( response.isSuccess ){

						return res.redirect( urls.barriers.team.list( barrierId ) );

					} else {

						error = 'There was an error adding the user, try again';
						reporter.message( 'error', 'Unable to add user to team', { member, barrierId, response } );
					}

				} catch ( e ){

					return next( e );
				}
			}
		}

		res.render( 'barriers/views/team/add', {
			...form.getTemplateValues(),
			...detailViewModel( req.barrier ),
			member,
			error,
		} );
	},

	search: async function( req, res, next ){

		let error;
		let users;

		const form = new Form( req, {
			query: {}
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				const { query } = form.getValues();
				try {

					const { response, body } = await sso.users.search( query );

					if( response.isSuccess ){

						users = body.results.map( createMemberForTemplate );

					} else {

						throw new HttpResponseError( 'Error searching for users', response, body );
					}

				} catch( e ){

					return next( e );
				}
			}
		}

		res.render( 'barriers/views/team/search', {
			...form.getTemplateValues(),
			users,
			error,
		} );
	},

	delete: async ( req, res, next ) => {

		const barrierId = req.barrier.id;
		const memberId = parseInt( req.params.memberId, 10 );
		const isPost = ( req.method === 'POST' );
		const member = req.members.find( ( member ) => member.id === memberId );

		if( !member ){

			return next( new Error( 'No matching team member found' ) );
		}

		if( isPost ){

			try {

				const { response, body } = await backend.barriers.team.delete( req, memberId );

				if( response.isSuccess ){

					res.redirect( urls.barriers.team.list( barrierId ) );

				} else {

					throw new HttpResponseError( 'Unable to delete user', response, body );
				}

			} catch( e ){

				next( e );
			}

		} else {

			if( req.xhr ){

				res.render( 'barriers/views/partials/delete-team-member-modal', {
					barrierId,
					member,
					csrfToken: req.csrfToken()
				} );

			} else {

				res.render( 'barriers/views/team/list', {
					...detailViewModel( req.barrier ),
					isDelete: true,
					csrfToken: req.csrfToken(),
					deleteMember: member,
				});
			}
		}
	},
};
