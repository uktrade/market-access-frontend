const { isCountry } = require( '../../../../lib/validators' );

module.exports = async ( req, res, next, countryId ) => {
    if (isCountry(countryId)){
        next();
    } else {
        next( new Error( 'Invalid countryId' ) );
    }
};
