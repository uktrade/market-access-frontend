const assert = require( 'assert' );
const { Given, When, Then, setDefaultTimeout } = require( 'cucumber' );
const driver = require( '../../helpers/driver' );
const urls = require( '../../../../app/lib/urls' );

setDefaultTimeout( 10000 );

function getPath( href ){
	return href.replace( /^http:\/\/.+?(\/.*)$/, '$1' );
}

Given( 'I\'m on the homepage', async () => {

	this.name = 'homepage';

	await driver.fetch( urls.index() );
	await driver.takeScreenshot( this.name );

	this.driver = driver.getInstance();
});

Given( 'I\'m on the add a barrier page', async () => {

	this.name = 'add-a-barrier';

	await driver.fetch( urls.reports.new() );
	await driver.takeScreenshot( this.name );

	this.driver = driver.getInstance();
});

Given( 'I\'m on the first step of adding a new barrier', async () => {

	this.name = 'add-a-barrier_start';

	await driver.fetch( urls.reports.start() );
	await driver.takeScreenshot( this.name );

	this.driver = driver.getInstance();
} );

Given( 'I\'m on the barrier details page', async () => {

	this.name = 'barrier-details';

	await driver.fetch( urls.index() );
	const link = await driver.byCss( '.standard-table__cell a' );
	await link.click();
	await driver.takeScreenshot( this.name );

	this.driver = driver.getInstance();
});

Given( 'I\'m on the what is a barrier page', async () => {

	this.name = 'what-is-a-barrier';

	await driver.fetch( urls.whatIsABarrier() );
	await driver.takeScreenshot( this.name );

	this.driver = driver.getInstance();
});

Given( 'I\'m on the find a barrier page', async () => {

	this.name = 'find-a-barrier';

	await driver.fetch( urls.findABarrier() );
	await driver.takeScreenshot( this.name );

	this.driver = driver.getInstance();
});

When( 'I navigate to the add a barrier page', async () => {

	const button = await driver.byCss( '.dash-button' );
	await button.click();
});

When( 'I navigate to the start page', async () => {

	const button = await driver.byCss( '.callout__button' );
	await button.click();
} );

Then( /^the title should be (.+)$/i, async ( title ) => {

	const pageTitle = await this.driver.getTitle();

	assert.equal( title, pageTitle );
});

Then( 'the page should not have any accessibility violations', async () => {

	const { violations } = await driver.accessibilityCheck( this.name || 'unknown' );

	assert.equal( violations, 0 );
} );

Then( 'there should be a link to add a barrier', async () => {

	const dashButton = await driver.byClass( 'dash-button' );
	const tag = await dashButton.getTagName();
	const href = await dashButton.getAttribute( 'href' );

	assert.equal( tag, 'a' );
	assert.equal( getPath( href ), urls.reports.new() );
} );

Then( /^the active heading link should be (.+)$/, async ( text ) => {

	const activeLink = await driver.byCss( '#sub-navigation .datahub-header__navigation__item__link--active' );
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
		[ 'Dashboard', '/' ],
		[ 'Add a barrier', urls.reports.new() ],
		[ 'Find a barrier', urls.findABarrier() ],
		[ 'What is a barrier?', urls.whatIsABarrier() ]
	];

	assert.equal( links.length, info.length );

	for( const [ index, link ] of links.entries() ){

		const text = await link.getText();
		const href = await link.getAttribute( 'href' );
		const [ infoText, infoPath ] = info[ index ];

		assert.equal( text, infoText );
		assert.equal( getPath( href ), infoPath );
	}
} );

Then( 'there should be a start banner with a start button', async () => {

	const banner = await driver.allByCss( '.callout' );
	const bannerButton = await driver.byCss( '.callout__button' );
	const buttonText = await bannerButton.getText();

	assert.equal( banner.length, 1 );
	assert.equal( buttonText, 'Start now' );
} );

Then( /^a task list with ([0-9]+) items?$/, async ( items ) => {

	const tasks = await driver.allByCss( '.task-list__item' );

	assert.equal( tasks.length, items );
} );

Then( /^there should be a ([a-zA-Z]+) button$/, async ( text ) => {

	const button = await driver.byCss( '.govuk-button' );
	const buttonText = await button.getAttribute( 'value' );

	assert.equal( buttonText, text );
} );

When( /^there should ([0-9]+) radio inputs$/, async ( count ) => {

	const radios = await driver.allByCss( '.problem-status .govuk-radios__input' );

	assert.equal( radios.length, count );
} );
