const AxeBuilder = require( 'axe-webdriverjs' );
const webdriver = require( 'selenium-webdriver' );
const config = require( '../test-config' );
const writeImage = require( './write-image' );
const writeReport = require( './write-report' );

const driver = new webdriver.Builder()
						.forBrowser( config.browser )
						.usingServer( config.seleniumServerUrl )
						.build();

module.exports = {

	getInstance: () => driver,

	fetch: ( path ) => {

		const url = ( config.baseUrl + path );
		//console.log( `Fetching url: ${ url }` );
		return driver.get( url );
	},

	takeScreenshot: async ( name ) => {

		try {

			const base64Data = await driver.takeScreenshot();
			return writeImage( name, base64Data );

		} catch( e ){

			console.error( e );
		}
	},

	accessibilityCheck: ( reportName ) => {

		return new Promise( ( resolve, reject ) => {

			if( !reportName ){

				return reject( 'Please specify a report name' );
			}
		
			AxeBuilder( driver )
				.analyze( async ( results ) => {


					const violations = results.violations;
					const violationCount = violations.length;

					if( violationCount > 0 ){

						console.log( JSON.stringify( violations, null, 3 ) );
					}

					try {

						await writeReport( reportName, results );

						resolve( {
							violations: violationCount
						} );
						
					} catch( e ){
						
						reject( e );
					}
				} );
		} );
	}
};
