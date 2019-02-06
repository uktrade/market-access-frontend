const AxeBuilder = require( 'axe-webdriverjs' );
const webdriver = require( 'selenium-webdriver' );
const config = require( '../test-config' );
const writeImage = require( './write-image' );
const writeReport = require( './write-report' );

const By = webdriver.By;

const driver = new webdriver.Builder()
						.forBrowser( config.browser )
						.usingServer( config.seleniumServerUrl )
						.build();

/*
async function logCookies(){

	const cookies = await driver.manage().getCookies();

	console.log( cookies );
}
*/

module.exports = {

	getInstance: () => driver,

	fetch: async ( path ) => {

		const url = ( config.baseUrl + path );
		//console.log( `Fetching url: ${ url }` );
		await driver.get( url );

		return driver.wait( () => driver.getTitle(), 5000 );
	},

	to: ( path ) => async () => {
		await driver.navigate().to( ( config.baseUrl + path ) );
		await driver.sleep( 10000 );
		return driver.wait( driver.findElement( By.css( 'h1' ) ), 5000 );
	},

	byClass: ( className ) => driver.findElement( By.className( className ) ),

	allByCss: ( selector ) => driver.findElements( By.css( selector ) ),
	byCss: ( selector ) => driver.findElement( By.css( selector ) ),

	takeScreenshot: async ( name ) => {

		try {

			const base64Data = await driver.takeScreenshot();
			return writeImage( name, base64Data );

		} catch( e ){

			console.error( e );
		}
	},

	accessibilityCheck: ( reportName ) => new Promise( ( resolve, reject ) => {

		if( !reportName ){

			return reject( 'Please specify a report name' );
		}

		AxeBuilder( driver )
			.disableRules( [ 'definition-list', 'dlitem' ] )// disable these rules as <div>s are allowed inside a <dl> but their rules are not updated yet!
			.analyze( async ( err, results ) => {

				if( err ){
					return reject( err );
				}

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
	})
};
