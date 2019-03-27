/*Copyright (c) 2015 Jessie

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.*/


/*
Return URI:
http://127.0.0.1:1337/?addClass=1&hasClass=1&removeClass=1&toggleClass=1&getDescendantsByClassName=1&getElement=1&getElementData=3&getElementPositionStyles=1&query=1&queryOne=1&setAriaAttribute=1&setElementData=3&attachListener=1&cancelDefault=1&detachListener=1&getEventTarget=1&bind=2&getInputValue=1&toArray=2
*/

var jessie;
jessie = jessie || {};
(function(global) {

	var globalDocument = global.document,
		isHostObjectProperty = function(object, property) {
			var objectProperty = object[property];
			return typeof objectProperty == 'object' && null !== objectProperty;
		},
		isHostMethod = function(object, method) {
			var objectMethod = object[method];
			var type = typeof objectMethod;
			return	type == 'function' ||
					type == 'object' && null !== objectMethod ||
					type == 'unknown';
		},
		hasFeatures = function() {
			var i = arguments.length;
			while (i--) {
				if (!jessie[arguments[i]]) {
					return false;
				}
			}
			return true;
		},
		html = isHostObjectProperty(globalDocument, 'documentElement') && globalDocument.documentElement,
		canCall = !!Function.prototype.call,
		isStyleCapable = !!(html && isHostObjectProperty(html, 'style'));



/*
Description:
Cutting edge, relies on `Array.prototype.slice`
*/

/*
Author:
David Mark
*/

var toArray;

if (canCall && Array.prototype.slice) {
	try {
		Array.prototype.slice.call(arguments, 0);
		toArray = function(a) {
			return Array.prototype.slice.call(a, 0);
		};
	} catch(e) {}
}




/*
Description:
Basic rendition which relies on valid markup i.e. forms with unique names and ids
*/

/*
See: <a href="https://groups.google.com/forum/#!starred/comp.lang.javascript/fVp-DWAIGnc">Article</a>

That's the most basic rendition: no allowance for screwy markup like this:

<input name="test">
<input id="test">
*/

/*
Degrades:
IE4, IE3, NN4
*/

/*
Author:
David Mark
*/

var getElement;

if (isHostMethod(document, 'getElementById')) {
	getElement = function(id, doc) {
		return (doc || document).getElementById(id);
	};
}



/*
Description:
Cutting edge only
*/

/*
Degrades:
Chrome 7, FF3.5, IE9, Safari 5.0, Opera 11.1, IOS Safari 4.3, Opera Mini 6.0, Opera Mobile 11.0, Android Safari 2.3
*/

/*
Author:
Adam Silver
*/

var removeClass;

if (html && isHostObjectProperty(html, "classList") && isHostMethod(html.classList, "remove") ) {
    removeClass = function(el, className) {
			return el.classList.remove(className);
    };
}



/*
Description:
Cutting edge
*/

/*
Degrades:
IE9, IE8, IE7, IE6, IE5.5, IE5, IE4, IE3, Chrome 7, FF3.5, Safari 5.0, Opera 11.1, IOS Safari 4.3, Opera Mini 6.0, Opera Mobile 11.0, Android Safari 2.3
*/

/*
Author:
Adam Silver
*/

var hasClass;

if (html && isHostObjectProperty(html, "classList") && isHostMethod(html.classList, "contains") ) {
	hasClass = function(el, className) {
		return el.classList.contains(className);
	};
}




/*
Description:
Cutting edge only
*/

/*
Degrades:
IE9, IE8, IE7, IE6, IE5.5, IE5, IE4, IE3 Chrome 7, FF3.5, Safari 5.0, Opera 11.1, IOS Safari 4.3, Opera Mini 6.0, Opera Mobile 11.0, Android Safari 2.3
*/

/*
Author:
Adam Silver
*/

var addClass;

if (html && isHostObjectProperty(html, "classList") && isHostMethod(html.classList, "add") ) {
	addClass = function(el, className) {
		return el.classList.add(className);
	};
}



var getInputValue;

/*
Description:
getInputValue



*/

getInputValue = function(elInput, defaultValue) {
	return elInput[defaultValue ? 'defaultValue' : 'value'];
};



/*
Description:
Relies on `Function.prototype.bind` and `Function.prototype.apply` and `Array.prototype.slice`
*/

/*
Degrades:
IE5, IE4, IE3
*/

var bind;

if (Function.prototype.bind) {
	bind = function(fn, thisObject) {
		return fn.bind.apply(fn, Array.prototype.slice.call(arguments, 1));
	};
}
else if (canCall && Array.prototype.slice) {
	bind = function(fn, context) {
		var prependArgs = Array.prototype.slice.call(arguments, 2);

		if (prependArgs.length) {
			return function() {
				return fn.apply(context, Array.prototype.concat.apply(prependArgs, arguments));
			};
		}
		return function() {
			return fn.apply(context, arguments);
		};
	};

}




/*
Description:
Cutting edge (W3 compliant)
*/

/*
Degrades:
IE8, IE7, IE6, IE5.5, IE5, IE4, IE3, Opera 7.6
*/

var getEventTarget;

if(html && isHostMethod(html, 'addEventListener')) {
	getEventTarget = function(e) {
		var target = e.target;
		// Check if not an element (e.g. a text node)
		if (1 != target.nodeType) {
			// Set reference to parent node (which must be an element)
			target = target.parentNode;
		}
		return target;
	};
}



/*
Description:
Cutting edge (W3 compliant)
*/

/*
Degrades:
IE8, IE7, IE6, IE5.5, IE5, IE4, IE3, NN4, Opera 7.6
*/

/*
Author:
David Mark
*/

var detachListener;

if(html && isHostMethod(html, 'removeEventListener')) {
	detachListener = function(el, eventType, fn) {
		el.removeEventListener(eventType, fn, false);
	};
}



/*
Description:
Cutting edge only
*/

/*
Degrades:
IE8, IE7, IE6, IE5.5, IE5, IE4, IE3, Opera 7.6
*/

/*
Author:
Adam Silver
*/

var cancelDefault;

if(html && isHostMethod(html, 'addEventListener')) {
	cancelDefault = function(e) {
		e.preventDefault();
	};
}



/*
Description:
Cutting edge
*/

/*
Degrades:
IE8, IE7, IE6, IE5.5, IE5, IE4, IE3, Opera 7.6
*/

/*
Author:
David Mark
*/

var attachListener;

if(html && isHostMethod(html, 'addEventListener')) {
	attachListener = function(el, eventType, fn) {
		el.addEventListener(eventType, fn, false);
		return fn;
	};
}



/*
 Description:
 Relies on el.dataset or el.setAttribute
 */

/*
 Degrades:
 IE5-
 */

/*
 Author:
 Graham Veal
 */

var setElementData;

if( html && isHostObjectProperty( html, "dataset" ) ){

	(function(){

		var reGetDashAndLetter = /-([a-z])/g;

		function convertDataName( match, letter ){

			return letter.toUpperCase();
		}

		setElementData = function( el, dataName, dataValue ){

			//convert the dataName to lowercase
			//then remove the dash and replace the character next to the dash with the upper case version
			dataName = dataName.toLowerCase().replace( reGetDashAndLetter, convertDataName );

			el.dataset[ dataName ] = dataValue;
		};

	}());

} else if( html && isHostMethod( html, "setAttribute" ) ){

	setElementData = function( el, dataName, dataValue ){

		el.setAttribute( 'data-' + dataName, dataValue );
	};
}




/*
Description:
Wide support
*/

var setAriaAttribute;

setAriaAttribute = function(el, attribute, value) {
    el.setAttribute('aria-' + attribute, value);
};



/*
Description:
Relies on `document.querySelector`
*/

/*
Author:
Christopher Thorn
*/

var queryOne;

if(globalDocument && isHostMethod(globalDocument, 'querySelector')) {
    queryOne = function(selector, doc) {
        return (doc || document).querySelector(selector);
    };
}



/*
Description:
Relies on `document.querySelectorAll` and `jessie.toArray`
*/

/*
Author:
David Mark
*/

var query;

if(globalDocument && isHostMethod(globalDocument, 'querySelectorAll') && toArray) {
	query = function(selector, doc) {
		return toArray((doc || document).querySelectorAll(selector));
	};
}



/*
Description:
Relies on `jessie.getElement`, `el.style` and `el.offsetLeft`
*/

// Taken from primer

var getElementPositionStyles;

if(html && getElement && isHostObjectProperty(html, 'style') &&
	'number' == typeof html.offsetLeft && 'string' == typeof html.style.left ) {
	
	getElementPositionStyles = (function() {
		var result,
			sides = ['left', 'top', 'right', 'bottom'],
			inlineStyles = {},
			findPosition;
			
		findPosition = function(el, sides) {
			var i,
				offsetLeft,
				offsetTop;
				
			offsetLeft = el.offsetLeft;
			offsetTop = el.offsetTop;
			el.style[sides[2]] = 'auto';
			el.style[sides[3]] = 'auto';
			
			if (offsetLeft != el.offsetLeft) {
				result[sides[0]] = null;
			}

			if (offsetTop != el.offsetTop) {
				result[sides[1]] = null;
			}

			offsetLeft = el.offsetLeft;
			offsetTop = el.offsetTop;

			el.style[sides[0]] = offsetLeft + 'px';
			el.style[sides[1]] = offsetTop + 'px';

			if (result[sides[0]] !== null && el.offsetLeft != offsetLeft) {
				if (sides[0] == 'left') {
					result[sides[0]] = offsetLeft - el.offsetLeft + offsetLeft;
				}
				else {
					result[sides[0]] = el.offsetLeft;
				}
			}

			if (result[sides[1]] !== null && el.offsetTop != offsetTop) {
				if (sides[1] == 'top') {
					result[sides[1]] = offsetTop - el.offsetTop + offsetTop;
				}
				else {
					result[sides[1]] = el.offsetTop;
				}
			}
			
			for (i = 4; i--;) {
				el.style[sides[i]] = inlineStyles[sides[i]];
			}
		};

		return function(el) {
			var i,
				side,
				otherSide;

			result = {};

			for (i = 2; i--;) {
				side = sides[i];
				otherSide = sides[i + 2];
				result[side] = result[otherSide] = el['offset' + side.charAt(0).toUpperCase() + side.substring(1)];
			}

			for (i = 4; i--;) {
				side = sides[i];
				inlineStyles[side] = el.style[side];
			}

			findPosition(el, sides);
			findPosition(el, sides.slice(2).concat(sides.slice(0, 2)));

			return result;
		};
		
	}());
}



/*
 Description:
 Relies on el.dataset or el.getAttribute for the most support
 */

/*
 Degrades:
 IE5-
 */

/*
 Author:
 Graham Veal
 */

var getElementData;

if( html && isHostObjectProperty( html, "dataset" ) ){

	(function(){

		var reGetDashAndLetter = /-([a-z])/g;

		function convertDataName( match, letter ){

			return letter.toUpperCase();
		}

		getElementData = function( el, dataName ){

			//convert the dataName to lowercase
			//then remove the dash and replace the character next to the dash with the upper case version
			dataName = dataName.toLowerCase().replace( reGetDashAndLetter, convertDataName );

			return el.dataset[ dataName ];
		};

	}());

} else if( html && isHostMethod( html, "getAttribute" ) ){

	getElementData = function( el, dataName ){

		return el.getAttribute( 'data-' + dataName );
	};
}



/*
Description:
Relies on 'document.getElementsByClassName'
*/

var getDescendantsByClassName;

if (globalDocument && isHostMethod(globalDocument, "getElementsByClassName") && toArray) {
	getDescendantsByClassName = function(el, className) {
		return toArray((el || document).getElementsByClassName(className));
	};
}



/*
 Description:
 Relies on the `jessie.hasClass` && `jessie.addClass` && `jessie.removeClass`
 */

/*
 Author:
 Ben Chidgey
 */

var toggleClass;

if (hasClass && addClass && removeClass) {
	toggleClass = function(el, className) {
		var toggle = hasClass(el, className) ? 'remove' : 'add';
		jessie[toggle + 'Class'](el, className);
	};
}


jessie.isHostMethod = isHostMethod;
jessie.isHostObjectProperty = isHostObjectProperty;
jessie.hasFeatures = hasFeatures;
jessie.toArray = toArray;
jessie.getElement = getElement;
jessie.removeClass = removeClass;
jessie.hasClass = hasClass;
jessie.addClass = addClass;
jessie.getInputValue = getInputValue;
jessie.bind = bind;
jessie.getEventTarget = getEventTarget;
jessie.detachListener = detachListener;
jessie.cancelDefault = cancelDefault;
jessie.attachListener = attachListener;
jessie.setElementData = setElementData;
jessie.setAriaAttribute = setAriaAttribute;
jessie.queryOne = queryOne;
jessie.query = query;
jessie.getElementPositionStyles = getElementPositionStyles;
jessie.getElementData = getElementData;
jessie.getDescendantsByClassName = getDescendantsByClassName;
jessie.toggleClass = toggleClass;

	globalDocument = html = null;

}(this));