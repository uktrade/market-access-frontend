const metadata = require( './metadata' );

const DELIMITER = ', ';

module.exports = {

	location: ( country, adminAreas ) => {

		const countryName = ( metadata.getCountry( country ) || {} ).name;
		const adminAreasString = adminAreas ? adminAreas.map(
			(adminAreaId) => ( metadata.getAdminArea( adminAreaId ) || {} ).name
		).join( DELIMITER ) : '';

		return adminAreasString ? `${ adminAreasString } (${ countryName })` : countryName;
	},

	locations: ( ids = [] ) => {

		const adminAreas = ids.filter( ( id ) => metadata.getAdminArea( id ) );
		const countries = ids.filter( ( id ) => metadata.getCountry( id ) ).map( ( id ) => metadata.getCountry( id ).name );
		const adminCountries = {};

		adminAreas.forEach( ( adminAreaId ) => {

			const adminArea = metadata.getAdminArea( adminAreaId );
			const countryId = adminArea.country.id;
			const admin = adminCountries[ countryId ] || { name: adminArea.country.name, areas: [] };

			admin.areas.push( adminArea.name );
			adminCountries[ countryId ] = admin;
		} );

		const adminText = Object.entries( adminCountries ).reduce( ( list, [ , item ] ) => list + ( list.length ? DELIMITER : '' ) + item.areas.join( DELIMITER ) + ' (' + item.name + ')', '' );

		return adminText + ( adminText.length && countries.length ? DELIMITER : '' ) + countries.join( DELIMITER );
	},

	regions: ( ids = [] ) => ids.map( ( id ) => metadata.getOverseasRegion( id ).name ).join( DELIMITER ),
	sectors: ( ids, allSectors = false) => {
		if (allSectors) {
			return 'All sectors';
		}
		return ids ? ids.map( ( id ) => metadata.getSector( id ).name ).join( DELIMITER ) : 'Unknown';
	},
	types: ( ids = [] ) => ids.map( ( id ) => metadata.getBarrierType( id ).title ).join( DELIMITER ),
	priorities: ( ids = [] ) => ids.map( ( id ) => metadata.getBarrierPriority( id ).name ).join( DELIMITER ),
	statuses: ( ids = [] ) => ids.map( ( id ) => metadata.getBarrierStatus( id ) ).join( DELIMITER ),
};
