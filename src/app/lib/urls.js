/*
function getReportLastCompletedStage( progress ){

	if( Array.isArray( progress ) ){

		let i = ( progress.length - 1 );
		let item;

		while( ( item = progress[ i-- ] ) ){

			if( item.status_id === 3 ){ // 3 === 'complete'

				return item;
			}
		}
	}
}
*/
function getReportPath( reportId ){
	return ( reportId ? reportId : 'new' );
}

const reportUrl = {
	index: () => '/reports/',
	detail: ( reportId ) => `/reports/${ reportId }/`,
	new: () => '/reports/new/',
	start: ( reportId ) => `/reports/${ getReportPath( reportId ) }/start/`,
	isResolved: ( reportId ) => `/reports/${ getReportPath( reportId ) }/is-resolved/`,
	country: ( reportId ) => `/reports/${ getReportPath( reportId ) }/country/`,
	hasAdminAreas: ( reportId, countryId ) => `/reports/${ getReportPath( reportId ) }/country/${ countryId }/has-admin-areas/`,
	adminAreas: {
		list: ( reportId, countryId ) => `/reports/${ getReportPath( reportId ) }/country/${ countryId }/admin-areas/`,
		add: ( reportId, countryId ) => `/reports/${ getReportPath( reportId ) }/country/${ countryId }/admin-areas/add/`,
		remove: ( reportId, countryId ) => `/reports/${ getReportPath( reportId ) }/country/${ countryId }/admin-areas/remove/`,
	},
	hasSectors: ( reportId ) => `/reports/${ reportId }/has-sectors/`,
	allSectors: ( reportId ) => `/reports/${ reportId }/all-sectors/`,
	sectors: ( reportId ) => `/reports/${ reportId }/sectors/`,
	addSector: ( reportId ) => `/reports/${ reportId }/sectors/add/`,
	removeSector: ( reportId ) => `/reports/${ reportId }/sectors/remove/`,
	aboutProblem: ( reportId ) => `/reports/${ reportId }/problem/`,
	summary: ( reportId ) => `/reports/${ reportId }/summary/`,
	submit: ( reportId ) => `/reports/${ reportId }/submit/`,
	delete: ( reportId ) => `/reports/${ reportId }/delete/`,
};

function addParams( path, map = {} ){

	const params = [];

	for( let [ key, value ] of Object.entries( map ) ){

		params.push( key + '=' + encodeURIComponent( value ) );
	}

	return path + ( params.length ? '?' + params.join( '&' ) : '' );
}

module.exports = {

	index: ( watchListIndex, params = {} ) => {

		if( watchListIndex > 0 ){

			params.list = watchListIndex;
		}

		return addParams( '/', params );
	},
	login: () => '/login/',
	me: () => '/me',
	whatIsABarrier: () => '/what-is-a-barrier/',
	findABarrier: ( params ) => addParams( '/find-a-barrier/', params ),
	downloadBarriers: ( params ) => addParams( '/find-a-barrier/download/', params ),

	documents: {
		download: ( documentId ) => `/documents/${ documentId }/download/`,
	},

	watchList: {
		save: ( params ) => addParams( '/watch-list/save/', params ),
		rename: ( index ) => addParams( `/watch-list/rename/${ index }/` ),
		remove:	( index ) => `/watch-list/remove/${ index }/`,
	},

	barriers: {
		detail: ( barrierId ) => `/barriers/${ barrierId }/`,
		edit: {
			product: ( barrierId ) => `/barriers/${ barrierId }/edit/product/`,
			title: (barrierId) => `/barriers/${ barrierId }/edit/title/`,
			description: ( barrierId ) => `/barriers/${ barrierId }/edit/description/`,
			source: ( barrierId ) => `/barriers/${ barrierId }/edit/source/`,
			priority: ( barrierId ) => `/barriers/${ barrierId }/edit/priority/`,
			euExitRelated: (barrierId) => `/barriers/${barrierId}/edit/eu-exit-related/`,
			problemStatus: ( barrierId ) => `/barriers/${ barrierId }/edit/problem-status/`,
			status: ( barrierId ) => `/barriers/${ barrierId }/edit/status/`,
		},
		documents: {
			add: ( barrierId ) => `/barriers/${ barrierId }/interactions/documents/add/`,
			cancel: ( barrierId ) => `/barriers/${ barrierId }/interactions/documents/cancel/`,
			delete: ( barrierId, documentId ) => `/barriers/${ barrierId }/interactions/documents/${ documentId }/delete/`,
		},
		notes: {
			add: ( barrierId ) => `/barriers/${ barrierId }/interactions/add-note/`,
			delete: ( barrierId, noteId ) => `/barriers/${ barrierId }/interactions/delete-note/${ noteId }/`,
			edit: ( barrierId, noteId ) => `/barriers/${ barrierId }/interactions/edit-note/${ noteId }/`,
			documents: {
				add: ( barrierId, noteId ) => `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/add/`,
				cancel: ( barrierId, noteId ) => `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/cancel/`,
				delete: ( barrierId, noteId, documentId ) => `/barriers/${ barrierId }/interactions/notes/${ noteId }/documents/${ documentId }/delete/`,
			},
		},
		status: ( barrierId ) => `/barriers/${ barrierId }/status/`,
		types: {
			list: ( barrierId ) => `/barriers/${ barrierId }/types/`,
			edit: ( barrierId ) => `/barriers/${ barrierId }/types/edit/`,
			new: ( barrierId ) => `/barriers/${ barrierId }/types/new/`,
			add: ( barrierId ) => `/barriers/${ barrierId }/types/add/`,
			remove: ( barrierId ) => `/barriers/${ barrierId }/types/remove/`,
		},
		sectors: {
			edit: ( barrierId ) => `/barriers/${ barrierId }/sectors/edit/`,
			list: ( barrierId ) => `/barriers/${ barrierId }/sectors/`,
			add: ( barrierId ) => `/barriers/${ barrierId }/sectors/add/`,
			addAllSectors: ( barrierId ) => `/barriers/${ barrierId }/sectors/add/all/`,
			remove: ( barrierId ) => `/barriers/${ barrierId }/sectors/remove/`,
			removeAllSectors: ( barrierId ) => `/barriers/${ barrierId }/sectors/remove/all/`,
			new: ( barrierId ) => `/barriers/${ barrierId }/sectors/new/`,
		},
		location: {
			list: ( barrierId ) => `/barriers/${ barrierId }/location/`,
			edit: ( barrierId ) => `/barriers/${ barrierId }/location/edit/`,
			country: ( barrierId ) => `/barriers/${ barrierId }/location/country/`,
			adminAreas: {
				add: ( barrierId ) => `/barriers/${ barrierId }/location/add-admin-area/`,
				remove: ( barrierId ) => `/barriers/${ barrierId }/location/remove-admin-area/`,
			}
		},
		companies: {
			new: ( barrierId ) => `/barriers/${ barrierId }/companies/new/`,
			edit: ( barrierId ) => `/barriers/${ barrierId }/companies/edit/`,
			list: ( barrierId ) => `/barriers/${ barrierId }/companies/`,
			details: ( barrierId, companyId ) => `/barriers/${ barrierId }/companies/${ companyId }/`,
			search: ( barrierId ) => `/barriers/${ barrierId }/companies/search/`,
			remove: ( barrierId ) => `/barriers/${ barrierId }/companies/remove/`
		},
		team: {
			list: ( barrierId ) => `/barriers/${ barrierId }/team/`,
			add: ( barrierId, memberId ) => {

				const path = `/barriers/${ barrierId }/team/add/`;

				if( typeof memberId !== 'undefined' ){

					return addParams( path, { user: memberId } );
				}

				return path;
			},
			search: ( barrierId ) => `/barriers/${ barrierId }/team/add/search/`,
			//edit: ( barrierId, memberId ) => `/barriers/${ barrierId }/team/edit/${ memberId }`,
			delete: ( barrierId, memberId ) => `/barriers/${ barrierId }/team/delete/${ memberId }`,
		},
		assessment: {
			detail: ( barrierId ) => `/barriers/${ barrierId }/assessment/`,
			economic: ( barrierId ) => `/barriers/${ barrierId }/assessment/economic/`,
			economyValue: ( barrierId ) => `/barriers/${ barrierId }/assessment/economy-value/`,
			marketSize: ( barrierId ) => `/barriers/${ barrierId }/assessment/market-size/`,
			exportValue: ( barrierId ) => `/barriers/${ barrierId }/assessment/export-value/`,
			commercialValue: ( barrierId ) => `/barriers/${ barrierId }/assessment/commercial-value/`,
			documents: {
				add: ( barrierId ) => `/barriers/${ barrierId }/assessment/documents/add/`,
				cancel: ( barrierId ) => `/barriers/${ barrierId }/assessment/documents/cancel/`,
				delete: ( barrierId, documentId ) => `/barriers/${ barrierId }/assessment/documents/${ documentId }/delete/`,
			},
		}
	},

	reports: reportUrl,

	reportStage: ( stageCode, report ) => {

		switch( stageCode ){
			case '1.1':
				return reportUrl.start( report.id );
			case '1.2':
				return reportUrl.country( report.id );
			case '1.3':
				return reportUrl.hasSectors( report.id );
			case '1.4':
				return reportUrl.aboutProblem( report.id );
			case '1.5':
				return reportUrl.summary( report.id );
			default:
				return reportUrl.detail( report.id );
		}
	}
};
