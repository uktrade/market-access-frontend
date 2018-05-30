const logger = require( './logger' );

let stubPath = '../../data/stubs/datahub/';

logger.warn( 'Using stubs for datahub' );

/*
if( config.datahub.fake ){

	logger.warn( 'Using fake stubs for datahub' );

	stubPath = '../../data/fake-stubs/datahub/';
}
*/
const response = { statusCode: 200, isSuccess: true, elapsedTime: 0 };

const stubs = [

	[ /^\/v3\/search\/company$/, 'search/company' ],
	[ /^\/v3\/company\/[a-z0-9-]+$/, 'company/details' ]
];

//ensure that we don't return a modified response
function getStub( path ){

	const json = JSON.stringify( require( path ) );

	return JSON.parse( json );
}

function get( url ){

	let data;
	let path;
	let stub;
	let pathMatched;

	response.request = {
		uri: {
			href: url,
			path: url
		}
	};

	for( [ path, stub ] of stubs ){

		pathMatched = path.test( url );

		if( pathMatched ){

			data = getStub( stubPath + stub  );

			break;
		}
	}

	return new Promise( ( resolve, reject ) => {
	
		if( data ){

			logger.debug( 'Stub response for: %s, with stub: %s', url, stub );
			resolve( { response, body: data } );

		} else {

			reject( new Error( `Path not matched for ${ url }` ) );
		}
	} );

}

module.exports = {

	get: ( path/*, token */ ) => get( path ),
	post: ( path, token, body ) => get( path, body )
};
