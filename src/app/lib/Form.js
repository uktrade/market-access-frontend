const validators = require( './validators' );

const RADIO = 'radio';
const SELECT = 'select';
const isDefined = validators.isDefined;

function camelCaseToDash( str ) {
	return str.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
}

function createId( name, type ){

	const dashedName = camelCaseToDash( name );

	switch( type ){

		case RADIO:
			return ( dashedName + '-1' );
		default:
			return dashedName;
	}
}

function getFirstValue( ...values ){

	// use Abstract Equality Comparison to cover undefined
	return values.find( ( value ) => value != null );
}

function createMatcher( key ){

	return ( value ) => {

		value = String( value );

		return ( item ) => {

			// need to use Abstract Equality Comparison
			// as some values are saved as a string but returned as a number
			item[ key ] = ( value == String( item.value ) );

			return item;
		};
	};
}

const isChecked = createMatcher( 'checked' );
const isSelected = createMatcher( 'selected' );

function Form( req, fields ){

	this.req = req;
	this.fields = fields;

	this.isPost = req.method === 'POST';
	this.isExit = ( this.isPost && ( req.body.action === 'exit' ) );
	this.fieldNames = [];
	this.values = {};
	this.errors = [];

	for( let [ name, field ] of Object.entries( fields ) ){

		this.addField( name, field );

		if( this.isPost ){
			this.values[ name ] = req.body[ name ];
		}
	}
}

Form.prototype.addField = function( name, field ){

	field.id = field.id || createId( name, field.type );

	this.fieldNames.push( name );

	field.validators = ( field.validators || [] );

	if( field.required ){

		field.validators.unshift( {
			fn: isDefined,
			message: field.required
		} );
	}
};

Form.prototype.passedConditions = function( name ){

	const field = this.fields[ name ];

	if( !field ){ throw new Error( name + ' field not found' ); }

	const conditional = field.conditional;

	if( conditional ){

		const value = this.values[ conditional.name ];

		if( Array.isArray( conditional.values ) ){

			return conditional.values.includes( value );

		} else {

			return ( value == conditional.value );
		}
	}

	return true;
};

Form.prototype.validateField = function( name ){

	const field = this.fields[ name ];

	if( !field ){ throw new Error( name + ' field not found' ); }

	const value = this.values[ name ];
	const shouldValidate = ( this.isExit ? isDefined( value ) : true );
	let valid = true;

	if( this.passedConditions( name ) && shouldValidate && Array.isArray( field.validators ) ){

		for( let { fn, message } of field.validators ){

			valid = fn( value );

			if( !valid ){
				this.errors.push( { id: field.id, message } );
				break;
			}
		}
	}

	return valid;
};

Form.prototype.validate = function(){

	for( let name of this.fieldNames ){

		this.validateField( name );
	}
};

Form.prototype.getValues = function(){

	const values = {};

	for( let name of this.fieldNames ){

		values[ name ] = this.getValue( name );
	}

	return values;
};

Form.prototype.getValue = function( name ){

	if( this.passedConditions( name ) ){

		return this.values[ name ];
	}
};

Form.prototype.getTemplateValues = function( errorsName ){

	const values = {
		csrfToken: this.req.csrfToken()
	};

	for( let name of this.fieldNames ){

		const field = this.fields[ name ];
		const formValue = this.getValue( name );
		const value = this.isPost ? formValue : getFirstValue( formValue, ...( field.values || [] ) );

		let templateValue;

		switch( field.type ){

			case RADIO:
				templateValue = field.items.map( isChecked( value ) );
			break;
			case SELECT:
				templateValue = field.items.map( isSelected( value ) );
			break;
			default:
				templateValue = value;
		}

		values[ name ] = templateValue;
	}

	if( this.hasErrors() ){

		values[ errorsName || 'errors' ] = this.getTemplateErrors();
	}

	return values;
};

Form.prototype.getTemplateErrors = function(){

	const errors = [];

	for( let { id, message } of this.errors ){

		errors.push({
			href: ( '#' + id ),
			text: message
		});
	}

	return errors;
};

Form.prototype.hasErrors = function(){
	return !!this.errors.length;
};

Form.RADIO = RADIO;
Form.SELECT = SELECT;

module.exports = Form;
