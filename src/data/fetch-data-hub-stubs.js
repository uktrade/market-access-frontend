const fs = require( 'fs' );
const path = require( 'path' );
const request = require( 'request' );
const appConfig = require( '../app/config' );

const token = appConfig.datahub.token;
const today = new Date();
const folderSuffix = [ today.getFullYear(), today.getMonth() + 1, today.getDate(), today.toLocaleTimeString( 'en-US', { hour12: false } ) ].join( '-' );

const stubs = [
	[ 'search/company', '/v3/search/company', { name: 'testbirds', offset: 0, limit: 20 } ],
	[ 'company/details', '/v3/company/00ca9155-a098-e211-a939-e4115bead28a' ]
];

function mkdirp( filePath ){

	const dirname = path.dirname( filePath );

	if( fs.existsSync( dirname ) ){

		return true;
	}

	mkdirp( dirname );
	fs.mkdirSync( dirname );
}

function fetch( file, urlPath, urlBody ){

	const requestOptions = {
		uri: `${ appConfig.datahub.url }${ urlPath }`,
		method: ( urlBody ? 'POST' : 'GET' ),
		json: true,
		headers: {
			Authorization: `Bearer ${ token }`
		}
	};

	if( urlBody ){
		requestOptions.body = urlBody;
	}

	console.log( requestOptions );

	const fileWithPath = path.resolve( __dirname, `stubs/datahub_${ folderSuffix }/`, `${ file }.json` );

	mkdirp( fileWithPath );

	const writeStream = fs.createWriteStream( fileWithPath );

	request( requestOptions )
		.on( 'error ', function( err ){ console.error( err ); } )
		.on( 'end', function(){ console.log( 'Written: %s', file ); } )
		.pipe( writeStream );

	writeStream.on( 'error', function( err ){ console.log( err ); } );
}

for( let stubArgs of stubs ){

	fetch( ...stubArgs );
}
