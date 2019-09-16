const metadata = require( '../../../lib/metadata' );
const Form = require( '../../../lib/Form' );
const urls = require( '../../../lib/urls' );
const validators = require( '../../../lib/validators' );
const backend = require( '../../../lib/backend-service' );
const HttpResponseError = require( '../../../lib/HttpResponseError' );

module.exports = {

	list: async (req, res, next) => {

		const barrier = req.barrier;
		const isPost = req.method === 'POST';

		if( !req.session.location ){
			req.session.location = {
				country: barrier.export_country,
				adminAreas: ( barrier.country_admin_areas || [] )
			};
		}

		const { country, adminAreas } = req.session.location;
		const isCountryWithAdminAreas = metadata.isCountryWithAdminArea( country );

		if( isPost ){

			try {

				const { response, body } = await backend.barriers.saveLocation( req, barrier.id, req.session.location );

				delete req.session.location;

				if( response.isSuccess ){

					return res.redirect( urls.barriers.detail( barrier.id ) );

				} else {

					return next( new HttpResponseError( 'Unable to update barrier', response, body ) );
				}

			} catch( e ){

				return next( e );
			}
		}

		res.render( 'barriers/views/location/list', {
			csrfToken: req.csrfToken(),
			country: metadata.getCountry( country ).name,
			showAdminAreas: isCountryWithAdminAreas,
			adminAreas: adminAreas.map( metadata.getAdminArea ),
		});
	},

	edit: ( req, res ) => {

		const barrier = req.barrier;
		const country = barrier.export_country;
		const adminAreas = ( barrier.country_admin_areas || [] );

		req.session.location = {
			country,
			adminAreas,
		};

		res.render( 'barriers/views/location/list', {
			csrfToken: req.csrfToken(),
			country: metadata.getCountry( country ).name,
			showAdminAreas: metadata.isCountryWithAdminArea( country ),
			adminAreas: adminAreas.map( metadata.getAdminArea ),
		});
	},

	country: ( req, res ) => {

		const barrier = req.barrier;

		const form = new Form( req, {
			country: {
				type: Form.SELECT,
				values: [ req.session.location.country ],
				items: metadata.getCountryList(),
				validators: [
					{
						fn: validators.isCountry,
						message: 'Select a location for this barrier'
					}
				]
			},
		} );

		if( form.isPost ){

			form.validate();

			if( !form.hasErrors() ){

				const { country } = form.getValues();
				req.session.location.country = country;

				if( !metadata.isCountryWithAdminArea( country ) ){
					req.session.location.adminAreas = [];
				}

				return res.redirect( urls.barriers.location.list( barrier.id ) );
			}
		}

		res.render( 'barriers/views/location/country', form.getTemplateValues() );
	},

	adminAreas: {
		add: ( req, res ) => {
			const barrier = req.barrier;
			const adminAreas = req.session.location.adminAreas;
			const country =  req.session.location.country;

			const form = new Form( req, {

				adminAreas: {
					type: Form.SELECT,
					items: metadata.getCountryAdminAreasList( country ).filter( ( adminArea ) => !adminAreas.includes( adminArea.value ) ),
					validators: [ {
						fn: validators.isCountryAdminArea,
						message: 'Select a admin area affected by the barrier'
					},{
						fn: ( value ) => !adminAreas.includes( value ),
						message: 'Admin area already added, choose another'
					} ]
				}
			} );

			if( form.isPost ){

				form.validate();

				if( !form.hasErrors() ){

					adminAreas.push( form.getValues().adminAreas );
					req.session.location.adminAreas = adminAreas;

					return res.redirect( urls.barriers.location.list( barrier.id ) );
				}
			}

			res.render( 'barriers/views/location/add-admin-area', Object.assign(
				form.getTemplateValues(),
				{ currentAdminAreas: adminAreas.map( metadata.getAdminArea ) },
			) );
		},

		remove: ( req, res ) => {
			const adminAreaToRemove = req.body.adminArea;

			req.session.location.adminAreas = req.session.location.adminAreas.filter( ( adminArea ) => adminArea !== adminAreaToRemove );

			res.redirect( urls.barriers.location.list( req.barrier.id ) );
		},
	}
};
