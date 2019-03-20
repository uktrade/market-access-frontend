const { isUuid, isCountry } = require( '../../../../lib/validators' );
const maxUuidLength = 60;

module.exports = async ( req, res, next, countryId ) => {
    if (isCountry(countryId)){
        next()
    } else {
        next( new Error( 'Invalid countryId' ) );
    }
};
