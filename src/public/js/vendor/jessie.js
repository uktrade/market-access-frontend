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
http://127.0.0.1:1337/?addClass=1&hasClass=1&removeClass=1&toggleClass=1&getDescendantsByClassName=1&query=1&queryOne=1&setAriaAttribute=1&attachListener=1&getInputValue=1&toArray=2
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
jessie.removeClass = removeClass;
jessie.hasClass = hasClass;
jessie.addClass = addClass;
jessie.getInputValue = getInputValue;
jessie.attachListener = attachListener;
jessie.setAriaAttribute = setAriaAttribute;
jessie.queryOne = queryOne;
jessie.query = query;
jessie.getDescendantsByClassName = getDescendantsByClassName;
jessie.toggleClass = toggleClass;

	globalDocument = html = null;

}(this));