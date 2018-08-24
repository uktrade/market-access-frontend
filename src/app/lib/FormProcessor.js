
function FormPocessor( params = {} ){

	if( !params.form ) throw new Error( 'form is required' );
	if( !params.render ) throw new Error( 'render is required' );
	if( !params.saveFormData ) throw new Error( 'saveFormData is required' );
	if( !params.saved ) throw new Error( 'saved is required' );

	this.form = params.form;
	this.render = params.render;
	this.saveFormData = params.saveFormData;
	this.saved = params.saved;
}

FormPocessor.prototype.doSave = async function( checkResponseErrors = false ){

	const { response, body } = await this.saveFormData( this.form.getValues() );

	if( response.isSuccess ){

		this.saved( body );

	} else if( checkResponseErrors && ( response.statusCode === 400 && body && body.fields ) ){

		this.form.addErrors( body.fields );

		if( this.form.hasErrors() ){

			this.doRender();

		} else {

			throw new Error( `No errors in response body, form not saved - got ${ response.statusCode } from backend` );
		}

	} else {

		const err = new Error( `Unable to save form - got ${ response.statusCode } from backend` );
		err.responseBody = body;

		throw err;
	}
};

FormPocessor.prototype.doRender = function() {

	this.render( this.form.getTemplateValues() );
};

FormPocessor.prototype.process = async function( opts = {} ){

	if( this.form.isPost ){

		this.form.validate();

		if( this.form.hasErrors() ){

			this.doRender();

		} else {

			await this.doSave( opts.checkResponseErrors );
		}

	} else {

		this.doRender();
	}
};

module.exports = FormPocessor;
