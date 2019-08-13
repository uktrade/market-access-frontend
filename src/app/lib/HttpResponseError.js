class HttpResponseError extends Error {

	constructor( message, { statusCode, headers }, body ){

		super( `${ message }. Received ${ statusCode } response code` );
		this.response = {
			statusCode,
			headers,
			body,
		};
	}
}

module.exports = HttpResponseError;
