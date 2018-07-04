const dateWithTime = require( './date-with-time' );

describe( 'Date with time filter', function(){
	describe( 'When a date is supplied', function(){
		describe( 'With a UTC timestamp', function(){
			it( 'Should return the correct date and time', function(){

				expect( dateWithTime( 1491004799 * 1000 ) ).toEqual( '31 March 2017 at 11:59pm' );
			} );
		} );

		describe( 'With a GMT date string', function(){
			it( 'Should return the correct date and time', function(){

				expect( dateWithTime( 'Fri, 31 Mar 2017 00:00:00 GMT' ) ).toEqual( '31 March 2017 at 12:00am' );
			} );
		} );

		describe( 'With a random string', function(){
			it( 'Should return the input', function(){

				expect( dateWithTime( 'random string' ) ).toEqual( 'random string' );
			} );
		} );

		it( 'Should return the date and the time', function(){

			expect( dateWithTime( 1487928284460 ) ).toEqual( '24 February 2017 at 9:24am' );
		} );
	} );

	describe( 'When the date is not supplied', function(){
		it( 'Should return the input', function(){

			expect( dateWithTime() ).toEqual();
		} );
	} );
} );
