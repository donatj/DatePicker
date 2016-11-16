"use strict";

/**
 * @param {Node} picker
 * @param {Object} options
 * @constructor
 */
var DatePicker = function( picker, options ) {
	var that = this;

	this.picker = picker;

	this.options = {
		outputFormat      : 'Y-m-d',
		days              : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		months            : ["January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"],
		next              : '▶',
		prev              : '◀',
		date              : new Date(),
		minDate           : false,
		maxDate           : false,
		onPick            : function() { /*....*/ },
		triggerChangeEvent: true,
		offsetX           : 0,
		offsetY           : 0
	};

	if( typeof options == "object" ) {
		for( var attr in options ) {
			if( options.hasOwnProperty(attr) ) {
				this.options[attr] = options[attr];
			}
		}
	}

	this.calendar = document.createElement('div');
	this.calendar.className = 'DatePicker';
	document.querySelector('body').appendChild(this.calendar);

	this.offset = 0;

	this.display = function() {
		var rect = that.picker.getBoundingClientRect();

		that.calendar.style.top = (rect.bottom + that.options.offsetX) + "px";
		that.calendar.style.left = (rect.left + that.options.offsetY) + "px";
		that.calendar.style.display = 'inline-block';
		this.calendar.style.visibility = 'inherit';
	};

	this.hide = function() {
		that.calendar.style.display = 'none';
	};

	var hideTimeout;
	this.picker.addEventListener('focus', function() {
		clearTimeout(hideTimeout);
		that.display();
	});

	this.picker.addEventListener('blur', function() {
		//that.calendar.style.visibility = 'hidden';
		hideTimeout = setTimeout(that.hide, 300);
	});

	this.render();
	that.hide();
};

DatePicker.prototype = {

	/**
	 * @param {Date} date
	 * @returns {number}
	 */
	getDaysInMonth: function( date ) {
		for( var i = 27; i <= 32; i++ ) {
			var workingDate = new Date(date.getFullYear(), date.getMonth(), i);
			if( workingDate.getMonth() != date.getMonth() ) {
				return i - 1;
			}
		}

		throw "Days in Month Unknown!";
	},

	/**
	 * @param {Date} date
	 */
	setPickerDate: function( date ) {
		this.picker.value = this.format(date, this.options.outputFormat);
	},

	/**
	 * @param {number} month
	 */
	setMonth: function( month ) {
		this.options.date.setMonth(month);
		this.render();
	},

	/**
	 * @param {number} year
	 */
	setYear: function( year ) {
		this.options.date.setYear(year);
		this.render();
	},

	getWorkingDate: function() {
		return (new Date(this.options.date.getFullYear(), this.options.date.getMonth(), 1))
	},

	render: function() {
		var that = this;
		this.calendar.innerHTML = '';

		var workingDate = this.getWorkingDate();
		var header = document.createElement('div');
		header.className = 'DatePicker-header';

		header.innerHTML = this.format(workingDate, 'F Y');

		this.calendar.appendChild(header);

		var next = document.createElement('span');

		next.className = 'DatePicker-next-month';
		next.innerHTML = this.options.next;

		next.addEventListener('click', function() {
			that.picker.focus();
			that.setMonth(that.options.date.getMonth() + 1);
		});

		var prev = document.createElement('span');

		prev.className = 'DatePicker-prev-month';
		prev.innerHTML = this.options.prev;

		prev.addEventListener('click', function() {
			that.picker.focus();
			that.setMonth(that.options.date.getMonth() - 1);
		});

		header.appendChild(next);
		header.appendChild(prev);

		var tbl = document.createElement('table');
		this.calendar.appendChild(tbl);

		var wday = workingDate.getDay() - this.offset;

		var tr = document.createElement('tr');
		tbl.appendChild(tr);

		var count = wday + 1;

		if( wday > 0 ) {
			var startTd = document.createElement('td');
			startTd.colSpan = wday;
			startTd.innerHTML = '&nbsp;';
			tr.appendChild(startTd);
		}

		for( var i = 1; i <= this.getDaysInMonth(this.options.date); i++ ) {
			var td = document.createElement('td');
			td.innerHTML = i;
			td.className = 'DatePicker-date';

			var dayDate = new Date(workingDate.getFullYear(), workingDate.getMonth(), i);


			if( (this.options.minDate === false || this.options.minDate <= dayDate) && (this.options.maxDate === false || this.options.maxDate >= dayDate) ) {
				td.addEventListener('click', function( date ) {
					return function() {
						that.setPickerDate(date);
						that.options.onPick.apply(that.picker);
						if( that.options.triggerChangeEvent ) {
							if( that.picker.dispatchEvent ) { // IE9+
								var evt = document.createEvent("HTMLEvents");
								evt.initEvent('change', true, true);
								return !that.picker.dispatchEvent(evt);
							}
						}
					}
				}(dayDate));
			} else {
				td.className += " DatePicker-date-disabled";
			}


			tr.appendChild(td);

			if( count > 6 ) {
				tr = document.createElement('tr');
				tbl.appendChild(tr);

				count = 0;
			}

			count++;
		}

		if( count != 1 ) {
			var endTd = document.createElement('td');
			endTd.colSpan = 8 - count;
			endTd.innerHTML = '&nbsp;';
			tr.appendChild(endTd);
		}

	},

	/**
	 * From: http://www.electricprism.com/aeron/calendar/
	 *
	 * License:
	 * MIT-style license.
	 *
	 * Copyright:
	 * Copyright (c) 2008 [Aeron Glemann](http://www.electricprism.com/aeron/)
	 *
	 * @param date
	 * @param format
	 * @returns {string}
	 */
	format: function( date, format ) {
		var str = '';
		if( date ) {
			var j = date.getDate(), w = date.getDay(),
				l = this.options.days[w],
				n = date.getMonth() + 1,
				f = this.options.months[n - 1],
				y = date.getFullYear() + '';
			for( var i = 0, len = format.length; i < len; i++ ) {
				var cha = format.charAt(i);
				switch( cha ) {
					case 'y': // xx - xx
						y = y.substr(2);
					case 'Y': // 19xx - 20xx
						str += y;
						break;
					case 'm': // 01 - 12
						if( n < 10 ) {
							n = '0' + n;
						}
					case 'n': // 1 - 12
						str += n;
						break;
					case 'M': // Jan - Dec
						f = f.substr(0, 3);
					case 'F': // January - December
						str += f;
						break;
					case 'd': // 01 - 31
						if( j < 10 ) {
							j = '0' + j;
						}
					case 'j': // 1 - 31
						str += j;
						break;
					case 'D': // Sun - Sat
						l = l.substr(0, 3);
					case 'l': // Sunday - Saturday
						str += l;
						break;
					case 'N': // 1 - 7
						w += 1;
					case 'w': // 0 - 6
						str += w;
						break;
					case 'S': // st, nd, rd or th (works well with j)
						if( j % 10 == 1 && j != '11' ) {
							str += 'st';
						} else if( j % 10 == 2 && j != '12' ) {
							str += 'nd';
						} else if( j % 10 == 3 && j != '13' ) {
							str += 'rd';
						} else {
							str += 'th';
						}
						break;
					default:
						str += cha;
				}
			}
		}
		return str;
	}
};

if( typeof define == "function" ) {
	define([], function() {
		return DatePicker;
	});
}
