const proxyquire = require( 'proxyquire' );
const faker = require( 'faker' );
const modulePath = './economic';

function createDoc(){

	return {
		id: faker.random.uuid(),
		name: faker.lorem.words( 2 ),
		size: faker.random.number(),
	};
}

describe( 'Economic assessemnt view model', () => {
	it( 'Adds the data to the model', () => {

		const documentAddUrl = 'add/x/y/z';
		const documentDeleteUrl = 'delete/x/y/z';
		const urls = {
			barriers: {
				assessment: {
					documents: {
						add: jasmine.createSpy( 'urs.barriers.assessment.documents.add' ).and.returnValue( documentAddUrl ),
						delete: jasmine.createSpy( 'urs.barriers.assessment.documents.delete' ).and.returnValue( documentDeleteUrl )
					},
				}
			}
		};

		const viewModel = proxyquire( modulePath, {
			'../../../../lib/urls': urls,
		} );

		const barrierId = faker.random.uuid();
		const documents = [
			createDoc(),
			createDoc(),
		];
		const templateValues = { a: 1, b: 2 };

		const data = viewModel( barrierId, documents, templateValues );

		expect( data ).toEqual( {
			...templateValues,
			xhr: {
				upload: documentAddUrl,
				delete: documentDeleteUrl,
			},
			documents: documents.map( ( doc ) => ({
				...doc,
				deleteUrl: documentDeleteUrl,
			}) ),
		} );

		expect( urls.barriers.assessment.documents.add ).toHaveBeenCalledWith( barrierId );
		expect( urls.barriers.assessment.documents.delete ).toHaveBeenCalledWith( barrierId, ':uuid' );
		expect( urls.barriers.assessment.documents.delete ).toHaveBeenCalledWith( barrierId, documents[ 0 ].id );
		expect( urls.barriers.assessment.documents.delete ).toHaveBeenCalledWith( barrierId, documents[ 1 ].id );
	} );
} );
