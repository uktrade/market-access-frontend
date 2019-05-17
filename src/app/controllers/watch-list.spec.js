const proxyquire = require( 'proxyquire' );
const modulePath = './watch-list';

let controller;
let req;
let res;
let next;
let csrfToken;
let backend;
let urls;
let metadata;
let validators;
let form;
let watchList;

describe( 'Watch list controller', () => {

	beforeEach( () => {

        backend = { watchList: { save: jasmine.createSpy( 'backend.watchList.save' ) } };

		( { req, res, next, csrfToken } = jasmine.helpers.mocks.middleware() );

        req.session = { user: { userProfile: {} } };
        
        urls = {
			index: jasmine.createSpy( 'urls.index' )
        };

        metadata = {
			getCountry: jasmine.createSpy( 'validators.getCountry' ),
			getSector: jasmine.createSpy( 'validators.getSector' ),
			getBarrierType: jasmine.createSpy( 'validators.getBarrierType' ),
			getBarrierPriority: jasmine.createSpy( 'validators.getBarrierPriority' ),
			getOverseasRegion: jasmine.createSpy( 'validators.getOverseasRegion' ),
		};

        validators = {
			isCountryOrAdminArea: jasmine.createSpy( 'validators.isCountryOrAdminArea' ),
			isOverseasRegion: jasmine.createSpy( 'validators.isOverseasRegion' ),
			isSector: jasmine.createSpy( 'validators.isSector' ),
			isBarrierType: jasmine.createSpy( 'validators.isBarrierType' ),
			isBarrierPriority: jasmine.createSpy( 'validators.isBarrierPriority' ),
        };
        
        form = {
			validate: jasmine.createSpy( 'form.validate' ),
			getValues: jasmine.createSpy( 'form.getValues' ),
			getTemplateValues: jasmine.createSpy( 'form.getTemplateValues' ),
			addErrors: jasmine.createSpy( 'form.addErrros' ),
		};

		controller = proxyquire( modulePath, {
			'../lib/metadata': metadata,
			'../lib/validators': validators,
			'../lib/Form': form,
			'../lib/backend-service': backend,
			'../lib/urls': urls,
		} );
    } );

    describe ( 'Save', () => {

    });

    describe ( 'Remove', () => {

        beforeEach(() => {
            req.session.user.userProfile.watchList = watchList;
        });

        describe( 'Without an error', () => {
            describe( 'With a success response', () => {
                it( 'Clears the watch list from the user profile', async () => {

                    const indexResponse = '/';
                    const watchListResponse = {
                        response: { isSuccess: true  }
                    };

                    urls.index.and.callFake( () => indexResponse );
                    backend.watchList.save.and.callFake( () => Promise.resolve( watchListResponse ) );

                    await controller.remove(req, res, next);

                    expect(req.session.user).toBeUndefined();
                    expect(backend.watchList.save).toHaveBeenCalledWith(
                        req, 
                        { watchList: {} }
                    );

                    expect( res.redirect ).toHaveBeenCalledWith( indexResponse );

                });
            });

            describe( ' Without a success response', () => {
                it( 'Should call next with the error', async () => {
                    const watchListResponse = {
                        response: { isSuccess: false  }
                    };

                    backend.watchList.save.and.callFake( () => Promise.resolve( watchListResponse ) );

                    await controller.remove( req, res, next );

                    expect( next ).toHaveBeenCalledWith( new Error( `Unable to get user info, got ${ watchListResponse.response.statusCode } response code` ) );

                    expect( res.render ).not.toHaveBeenCalled();
                });
            });
        });

        describe( 'With an error', () => {
            it( 'Should call next with the error', async () => {
                const err = new Error( 'issue with backend' );

                backend.watchList.save.and.callFake( () => Promise.reject( err ) );

                await controller.remove( req, res, next );

                expect( next ).toHaveBeenCalledWith( err );
            } );
        });
    });
});