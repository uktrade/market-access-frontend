const assert = require( 'assert' );
const { Given, When, Then, setDefaultTimeout } = require( 'cucumber' );
const driver = require( '../../helpers/driver' );
const urls = require( '../../../../app/lib/urls' );

setDefaultTimeout( 10000 );

function getPath( href ){
	return href.replace( /^http:\/\/.+?(\/.*)$/, '$1' );
}

Given( 'I\'m on the homepage', async () => {

	await driver.fetch( urls.index() );
	await driver.takeScreenshot( 'homepage' );

	this.driver = driver.getInstance();
});

Given( 'I\'m on the report a barrier page', async () => {

	await driver.fetch( urls.report.index() );
	await driver.takeScreenshot( 'report-a-barrier' );

	this.driver = driver.getInstance();
});

Given( 'I\'m on the start a report page', async () => {

	await driver.fetch( urls.report.start() );
	await driver.takeScreenshot( 'report-a-barrier_start' );

	this.driver = driver.getInstance();
} );

When( 'I navigate to the report a barrier page', async () => {

	const button = await driver.byCss( '.dash-button' );
	await button.click();
});

When( 'I navigate to the start page', async () => {

	const button = await driver.byCss( '.start-banner__button' );
	await button.click();
} );

Then( /^the title should be (.+)$/i, async ( title ) => {

	const pageTitle = await this.driver.getTitle();

	assert.equal( title, pageTitle );
});

Then( 'the page should not have any accessibility violations', async () => {

	const { violations } = await driver.accessibilityCheck( 'homepage' );

	assert.equal( violations, 0 );
} );

Then( 'there should be a link to report a barrier', async () => {

	const dashButton = await driver.byClass( 'dash-button' );
	const tag = await dashButton.getTagName();
	const href = await dashButton.getAttribute( 'href' );

	assert.equal( tag, 'a' );
	assert.equal( getPath( href ), '/report/' );
} );

 Then( /^the active heading link should be (.+)$/, async ( text ) => {

	const activeLink = await driver.byCss( '#proposition-links .active' );
	const linkText = await activeLink.getText();

	assert.equal( text, linkText );
 } );

 Then( /^the main heading should be (.+)$/, async ( text ) => {

	const heading = await driver.byCss( 'h1' );
	const headingText = await heading.getText();

	assert.equal( text, headingText.replace( '\n', ' ' ) );
 } );

Then( 'the footer links should be present', async () => {

	const links = await driver.allByCss( '.govuk-footer__list  a' );
	const info = [
		[ 'View Data Hub', '/#' ],
		[ 'Dashboard', '/' ],
		[ 'Report a barrier', '/report/' ],
		[ 'Find a barrier', '/#' ],
		[ 'What is a barrier?', '/#' ]
	];

	assert.equal( links.length, 5 );

	for( const [ index, link ] of links.entries() ){

		//const link = links[ index ];
		const text = await link.getText();
		const href = await link.getAttribute( 'href' );
		const [ infoText, infoPath ] = info[ index ];

		assert.equal( text, infoText );
		assert.equal( getPath( href ), infoPath );
	}
} );

Then( 'there should be a start banner with a start button', async () => {

	const banner = await driver.allByCss( '.start-banner' );
	const bannerButton = await driver.byCss( '.start-banner__button' );
	const buttonText = await bannerButton.getText();

	assert.equal( banner.length, 1 );
	assert.equal( buttonText, 'Start now' );
} );

Then( /^a task list with ([0-9]+) items?$/, async ( items ) => {

	const tasks = await driver.allByCss( '.task-list__item' );

	assert.equal( tasks.length, items );
} );

Then( /^there should be a ([a-zA-Z]+) button$/, async( text ) => {

	const button = await driver.byCss( '.govuk-button' );
	const buttonText = await button.getAttribute( 'value' );

	assert.equal( buttonText, text );
} );

Then( /^it should (reveal|hide) the emergency question$/, async ( state ) => {

	const isHidden = ( state === 'hide' );
	const emergencyElem = await driver.byCss( '.report-barrier-emergency' );
	const classes = await emergencyElem.getAttribute( 'class' );
	const ariaHidden = await emergencyElem.getAttribute( 'aria-hidden' );

	assert.equal( !!~classes.indexOf( ' visually-hidden' ), isHidden );
	assert.equal( ariaHidden, '' + isHidden );
} );

When( /^I click the ([a-z]+) status radio$/, async ( position ) => {

	const radioMap = {
		first: 0,
		second: 1,
		third: 2
	};

	const radios = await driver.allByCss( '.problem-status .govuk-radios__input' );
	const radioIndex = radioMap[ position ];
	const radio = radios[ radioIndex ];
	await radio.click();
} );
