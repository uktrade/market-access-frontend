const assert = require( 'assert' );
const { Given, When, Then } = require( 'cucumber' );
const driver = require( '../../helpers/driver' );

Given( 'I\'m on the homepage', async () => {
	
	await driver.fetch( '/' );
	const manage = driver.getInstance().manage();
	const cookies = await manage.getCookies();

	console.log( cookies );

	this.driver = driver.getInstance();
});

Then( /^the title should be ([a-z :]+)$/i, async ( title ) => {

	const pageTitle = await this.driver.getTitle();
	await driver.takeScreenshot( 'homepage' );

	assert.equal( title, pageTitle );
});

Then( 'the page should not have any accessibility violations', async () => {

	const { violations } = await driver.accessibilityCheck( 'homepage' );

	assert.equal( violations, 0 );
} );
