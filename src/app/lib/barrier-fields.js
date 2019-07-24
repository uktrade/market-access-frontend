const Form = require( './Form' );
const validators = require( './validators' );

const invalidDateMessage = 'Enter resolution date and include a month and year';

module.exports = {

	createStatusDate: function( dateValues = {}, monthName = 'month', yearName = 'year' ){

		function createDateObj( values ){
			return { month: values[ monthName ], year: values[ yearName ] };
		}

		return {
			type: Form.GROUP,
			validators: [ {
				fn: validators.isDateValue( monthName ),
				message: invalidDateMessage
			},{
				fn: validators.isDateValue( yearName ),
				message: invalidDateMessage
			},{
				fn: ( parts ) => validators.isDateNumeric( createDateObj( parts ) ),
				message: 'Resolution date must only include numbers'
			},{
				fn: ( parts ) => validators.isDateValid( createDateObj( parts ) ),
				message: invalidDateMessage
			},{
				fn: ( parts ) => validators.isDateInPast( createDateObj( parts ) ),
				message: 'Resolution date must be this month or in the past'
			} ],
			items: {
				[ monthName ]: {
					values: [ dateValues[ monthName ] ],
				},
				[ yearName ]: {
					values: [ dateValues[ yearName ] ],
				}
			}
		};
	}
};
