const TRUNCATION_SYMBOL = '…';

function getPageLink( page, query = {} ){

	const newQuery = {
		...query,
		page,
	};
	const params = Object.entries( newQuery ).map( ( [ key, value ] ) => `${ key }=${ value }` );

	return `?${ params.join( '&' ) }`;
}

function truncatePages( pagination, blockSize ){

	const pages = pagination.pages;

	if( pages.length <= blockSize ){ return pagination; }

	const currentPageNum = pagination.currentPage;
	const currentPageIndex = pagination.currentPage - 1;
	const firstPage = pages[ 0 ];
	const lastPage = pages[ pages.length - 1 ];

	const blockPivot = Math.round( blockSize / 2 );
	const startOfCurrentBlock = Math.abs( currentPageNum - blockPivot );
	const startOfLastBlock = ( lastPage.label - blockSize );
	const blockStartIndex = Math.min( startOfCurrentBlock, startOfLastBlock, currentPageIndex );

	let truncatedPages = pages.slice( blockStartIndex ).splice( 0, blockSize );
	const firstOfTruncatedPagesNum = truncatedPages[ 0 ].label;
	const lastOfTruncatedPagesNum = truncatedPages[ truncatedPages.length - 1 ].label;

	if( firstOfTruncatedPagesNum > 3 ){
		truncatedPages.unshift( { label: TRUNCATION_SYMBOL } );
	}
	if( firstOfTruncatedPagesNum === 3 ){
		truncatedPages.unshift( pages[ 1 ] );
	}
	if( firstOfTruncatedPagesNum > 1 ){
		truncatedPages.unshift( firstPage );
	}

	if( lastOfTruncatedPagesNum < lastPage.label - 2 ){
		truncatedPages.push( { label: TRUNCATION_SYMBOL } );
	}
	if( lastOfTruncatedPagesNum === lastPage.label - 2 ){
		truncatedPages.push( pages[ pages.length - 2 ] );
	}
	if( lastOfTruncatedPagesNum < lastPage.label ){
		truncatedPages.push( lastPage );
	}

	pagination.pages = truncatedPages;

	return pagination;
}

module.exports = {
	create: ( query, limit, count, page = 1, truncate = 4 ) => {

		if( !count ){ return null; }

		const totalPages = Math.ceil( count / limit );

		if( totalPages < 2 ){
			return {
				totalPages,
				currentPage: page,
			};
		}

		const pagination = {
			totalPages,
			currentPage: page,
			prev: ( page > 1 ? getPageLink( page - 1 , query ) : null ),
			next: ( page === totalPages ? null : getPageLink( page + 1, query ) ),
			pages: Array.from( { length: totalPages } ).map( ( _, idx ) => ({
				label: idx + 1,
				url: getPageLink( idx + 1, query ),
			})),
		};

		return truncatePages( pagination, truncate );
	}
};
