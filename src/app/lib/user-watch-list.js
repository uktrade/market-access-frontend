const backend = require( './backend-service' );
const VERSION = 2;

async function saveWatchList( req, watchList ){

	const user = req.session.user;
	//clone the profile to avoid updating the session before a successful save
	const newProfile = { ...user.user_profile, watchList };

	const { response, body } = await backend.watchList.save( req, newProfile );

	if( response.isSuccess ){

		//can now safely update the session value
		user.user_profile = newProfile;

	} else {

		const err = new Error( `Unable to save watch list, got ${ response.statusCode } response code` );
		err.responseBody = body;

		throw( err );
	}
}

function getWatchList( req ){

	const profile = req.session.user.user_profile;
	const watchList = ( profile && profile.watchList );

	return ( watchList || { version: VERSION, lists: [] } );
}

async function migrate( req, currentWatchList ){

	if( !currentWatchList.version ){

		const watchList = {
			version: VERSION,
			lists: [ currentWatchList ],
		};

		await saveWatchList( req, watchList );
	}
}

class UserWatchList {

	constructor( req ){

		const watchList = getWatchList( req );

		if( watchList.version !== VERSION ){
			throw new Error( 'user watchList is not the correct version' );
		}

		this.req = req;
		//clone the watchlist to avoid saving a modified version to the session
		this.watchList = {
			version: VERSION,
			lists: [ ...watchList.lists ],
		};
	}

	get lists(){

		return this.watchList.lists;
	}

	async add( name, filters ){

		this.lists.push( {
			name,
			filters,
		} );

		await this.save();
	}

	async update( index, name, filters ){

		const list = this.lists[ index ];

		if( list ){

			this.lists.splice( index, 1, { name, filters } );

			await this.save();
		}
	}

	async remove( index ){

		const watchLists = this.lists;
		const maxIndex = ( watchLists.length - 1 );

		if( index <= maxIndex ){

			watchLists.splice( index, 1 );
			await this.save();
		}
	}

	async save(){

		await saveWatchList( this.req, this.watchList );
	}

	static async migrateAndSave( req ){

		const watchList = getWatchList( req );

		if( watchList.version !== VERSION ){

			await migrate( req, watchList );
			return true;
		}

		return false;
	}
}

module.exports = UserWatchList;
