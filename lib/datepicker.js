"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var HIDE_DELAY_MS = 300;
function createButton(className, text, onClick, ariaLabel) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    if (ariaLabel) {
        button.setAttribute('aria-label', ariaLabel);
    }
    button.addEventListener('click', onClick);
    return button;
}
function getDaysInMonth(date) {
    for (var i = 27; i <= 32; i++) {
        var workingDate = new Date(date.getFullYear(), date.getMonth(), i);
        if (workingDate.getMonth() !== date.getMonth()) {
            return i - 1;
        }
    }
    throw new Error("Days in Month Unknown!");
}
function pageRect(elm) {
    var irect = elm.getBoundingClientRect();
    return new /** @class */ (function () {
        function class_1() {
            this.bottom = irect.bottom + window.scrollY;
            this.top = irect.y + window.scrollY;
            this.left = irect.x - window.scrollX;
            this.right = irect.right - window.scrollX;
        }
        class_1.prototype.height = function () {
            return this.bottom - this.top;
        };
        return class_1;
    }())();
}
var DatePicker = /** @class */ (function () {
    /**
     * @param {!Node} pickerInput
     * @param {?Object} options
     * @constructor
     */
    function DatePicker(pickerInput, options) {
        var _this = this;
        this.pickerInput = pickerInput;
        this.offset = 0;
        this.calendar = document.createElement('div');
        this.hideTimeout = 0;
        this.options = {
            outputFormat: 'Y-m-d',
            days: function (day, format) {
                return new Date(1995, 1, day).toLocaleDateString(document.documentElement.lang || 'en', { weekday: format });
            },
            months: function (month, format) {
                return new Date(2000, month, 2).toLocaleDateString(document.documentElement.lang || 'en', { month: format });
            },
            date: new Date(),
            parseUserInput: true,
            pickerDate: null,
            pickerDateUTC: true,
            next: '▶',
            prev: '◀',
            maxDate: null,
            minDate: null,
            onPick: function () { },
            triggerChangeEvent: true,
            offsetX: 0,
            offsetY: 0,
            parentNode: document.body
        };
        this.options = __assign(__assign({}, this.options), options);
        this.calendar.className = 'DatePicker';
        if (!this.options.parentNode) {
            throw new Error("Failed to find parent node");
        }
        this.pickerInput.addEventListener('focus', function () {
            clearTimeout(_this.hideTimeout);
            _this.display();
        });
        this.pickerInput.addEventListener('blur', function () {
            _this.scheduleHide();
        });
        this.calendar.addEventListener('focusin', function () {
            clearTimeout(_this.hideTimeout);
        });
        this.calendar.addEventListener('focusout', function () {
            _this.scheduleHide();
        });
        var scrollTimeout = 0;
        document.addEventListener('scroll', function () {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(_this.updatePosition.bind(_this), 1000);
        }, true);
        if (this.options.pickerDate !== null) {
            this.setPickerDate(this.options.pickerDate);
        }
        else if (this.options.parseUserInput !== false) {
            this.setPickerDate(this.pickerInput.value);
        }
        if (this.options.parseUserInput) {
            var wasInput_1 = false;
            this.pickerInput.addEventListener('input', function () {
                wasInput_1 = true;
            });
            this.pickerInput.addEventListener('change', function () {
                if (wasInput_1) {
                    try {
                        _this.setPickerDate(_this.pickerInput.value);
                    }
                    catch (_a) {
                        _this.setPickerDate(_this.options.pickerDate);
                    }
                }
                wasInput_1 = false;
            });
        }
        this.render('day');
    }
    DatePicker.prototype.parseUserDate = function (input) {
        if (input.trim() == '') {
            return null;
        }
        var d1 = new Date(input);
        if (isNaN(d1.getTime())) {
            var newInput = input.replace(/(\d)(?:st|nd|rd|th)/g, "$1");
            if (newInput != input) {
                return this.parseUserDate(newInput);
            }
            throw new Error('failed to parse date');
        }
        var d2 = new Date(input + " GMT-0000");
        if (isNaN(d2.getTime())) {
            d2 = d1;
        }
        if (this.options.pickerDateUTC) {
            return new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate()));
        }
        return new Date(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate());
    };
    DatePicker.prototype.hide = function () {
        if (this.calendar.parentNode !== null) {
            this.calendar.parentNode.removeChild(this.calendar);
        }
    };
    DatePicker.prototype.display = function () {
        if (this.calendar.parentNode === null) {
            this.render('day');
            this.options.parentNode.appendChild(this.calendar);
        }
        this.updatePosition();
    };
    DatePicker.prototype.scheduleHide = function () {
        var _this = this;
        clearTimeout(this.hideTimeout);
        this.hideTimeout = window.setTimeout(function () {
            var activeElement = document.activeElement;
            if (activeElement !== _this.pickerInput && (activeElement === null || !_this.calendar.contains(activeElement))) {
                _this.hide();
            }
        }, HIDE_DELAY_MS);
    };
    DatePicker.prototype.updatePosition = function () {
        if (this.calendar.parentNode === null) {
            return;
        }
        var pickerRect = pageRect(this.pickerInput);
        var pageBottom = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + window.scrollY;
        var top = Math.max(Math.max(pickerRect.bottom + this.options.offsetX, 0), window.scrollY);
        this.calendar.style.top = "".concat(top, "px");
        this.calendar.style.left = "".concat(pickerRect.left + this.options.offsetY, "px");
        this.calendar.style.display = 'inline-block';
        this.calendar.style.visibility = 'inherit';
        var calRect = pageRect(this.calendar);
        if (calRect.bottom > pageBottom) {
            this.calendar.style.top = "".concat((pickerRect.top - calRect.height()) + this.options.offsetX, "px");
        }
        calRect = pageRect(this.calendar);
        if (calRect.bottom > pageBottom) {
            this.calendar.style.top = "".concat(pageBottom - calRect.height(), "px");
        }
    };
    DatePicker.prototype.getDateMonth = function (date) {
        return this.options.pickerDateUTC ? date.getUTCMonth() : date.getMonth();
    };
    DatePicker.prototype.getDateYear = function (date) {
        return this.options.pickerDateUTC ? date.getUTCFullYear() : date.getFullYear();
    };
    /**
     * Set the currently picked date of the picker
     *
     * @param {?Date} date
     */
    DatePicker.prototype.setPickerDate = function (date) {
        if (typeof date === "string") {
            var userDate = void 0;
            if (typeof this.options.parseUserInput == "function") {
                userDate = this.options.parseUserInput(date);
            }
            else {
                userDate = this.parseUserDate(date);
            }
            this.setPickerDate(userDate);
            return;
        }
        this.options.pickerDate = date;
        this.pickerInput.value = date ? this.format(date, this.options.outputFormat, this.options.pickerDateUTC) : '';
        if (date) {
            this.updateMonth(this.getDateMonth(date));
            this.updateYear(this.getDateYear(date));
        }
        this.render('day');
    };
    /**
     * Get the current date of the picker
     *
     * @return {?Date}
     */
    DatePicker.prototype.getPickerDate = function () {
        return this.options.pickerDate;
    };
    /**
     * Set the month of the calendar
     *
     * @param {!number} month
     */
    DatePicker.prototype.setMonth = function (month) {
        this.updateMonth(month);
        this.render('day');
    };
    /**
     * Set the year of the calendar
     *
     * @param {!number} year
     */
    DatePicker.prototype.setYear = function (year) {
        this.updateYear(year);
        this.render('day');
    };
    DatePicker.prototype.updateMonth = function (month) {
        this.options.date.setMonth(month);
    };
    DatePicker.prototype.updateYear = function (year) {
        this.options.date.setFullYear(year);
    };
    /**
     * @param {?Date} date
     */
    DatePicker.prototype.setMinDate = function (date) {
        this.options.minDate = date;
        this.render('day');
    };
    /**
     * @param {?Date} date
     */
    DatePicker.prototype.setMaxDate = function (date) {
        this.options.maxDate = date;
        this.render('day');
    };
    /**
     * @param callback
     */
    DatePicker.prototype.setOnPick = function (callback) {
        this.options.onPick = callback;
    };
    /**
     * Get the current calendar year and month as a Date object in local-time
     *
     * @returns {Date}
     */
    DatePicker.prototype.getWorkingDate = function () {
        return (new Date(this.options.date.getFullYear(), this.options.date.getMonth(), 1));
    };
    DatePicker.prototype.render = function (view) {
        this.calendar.innerHTML = '';
        if (view === 'day') {
            this.renderDayView();
        }
        else if (view === 'month') {
            this.renderMonthView();
        }
        else if (view === 'year') {
            this.renderYearView();
        }
        this.updatePosition();
    };
    DatePicker.prototype.renderDayView = function () {
        var _this = this;
        var workingDate = this.getWorkingDate();
        var header = document.createElement('div');
        header.className = 'DatePicker-header';
        var monthButton = createButton('DatePicker-month-label', this.format(workingDate, 'F', false), function () {
            _this.render('month');
            _this.pickerInput.focus();
        }, 'Choose month');
        var yearButton = createButton('DatePicker-year-label', this.format(workingDate, 'Y', false), function () {
            _this.render('year');
            _this.pickerInput.focus();
        }, 'Choose year');
        header.appendChild(monthButton);
        header.appendChild(yearButton);
        this.calendar.appendChild(header);
        var next = createButton('DatePicker-next-month', this.options.next, function () {
            _this.updateMonth(_this.options.date.getMonth() + 1);
            _this.render('day');
            _this.pickerInput.focus();
        }, 'Next month');
        var prev = createButton('DatePicker-prev-month', this.options.prev, function () {
            _this.updateMonth(_this.options.date.getMonth() - 1);
            _this.render('day');
            _this.pickerInput.focus();
        }, 'Previous month');
        header.appendChild(next);
        header.appendChild(prev);
        var tbl = document.createElement('table');
        this.calendar.appendChild(tbl);
        var wday = workingDate.getDay() - this.offset;
        var tr = document.createElement('tr');
        tbl.appendChild(tr);
        var count = wday + 1;
        if (wday > 0) {
            var startTd = document.createElement('td');
            startTd.colSpan = wday;
            startTd.innerHTML = '&nbsp;';
            tr.appendChild(startTd);
        }
        for (var i = 1; i <= getDaysInMonth(this.options.date); i++) {
            var td = document.createElement('td');
            td.innerHTML = i.toString();
            td.className = 'DatePicker-date';
            var dayDate = void 0;
            if (this.options.pickerDateUTC) {
                dayDate = new Date(Date.UTC(workingDate.getFullYear(), workingDate.getMonth(), i));
            }
            else {
                dayDate = new Date(workingDate.getFullYear(), workingDate.getMonth(), i);
            }
            if ((this.options.minDate === null || this.options.minDate <= dayDate)
                && (this.options.maxDate === null || this.options.maxDate >= dayDate)) {
                td.addEventListener('click', (function (date) {
                    return function () {
                        _this.setPickerDate(date);
                        _this.options.onPick.apply(_this.pickerInput, [date]);
                        if (_this.options.triggerChangeEvent) {
                            if (_this.pickerInput.dispatchEvent) { // IE9+
                                var evt = document.createEvent("HTMLEvents");
                                evt.initEvent('change', true, true);
                                return !_this.pickerInput.dispatchEvent(evt);
                            }
                        }
                        return undefined;
                    };
                })(dayDate));
            }
            else {
                td.className += " DatePicker-date-disabled";
            }
            tr.appendChild(td);
            if (count > 6) {
                tr = document.createElement('tr');
                tbl.appendChild(tr);
                count = 0;
            }
            count++;
        }
        if (count != 1) {
            var endTd = document.createElement('td');
            endTd.colSpan = 8 - count;
            endTd.innerHTML = '&nbsp;';
            tr.appendChild(endTd);
        }
    };
    DatePicker.prototype.renderMonthView = function () {
        var _this = this;
        var workingDate = this.getWorkingDate();
        var header = document.createElement('div');
        header.className = 'DatePicker-header';
        var yearButton = createButton('DatePicker-year-label', this.format(workingDate, 'Y', false), function () {
            _this.render('year');
            _this.pickerInput.focus();
        }, 'Choose year');
        header.appendChild(yearButton);
        this.calendar.appendChild(header);
        var next = createButton('DatePicker-next-year', this.options.next, function () {
            _this.updateYear(_this.options.date.getFullYear() + 1);
            _this.render('month');
            _this.pickerInput.focus();
        }, 'Next year');
        var prev = createButton('DatePicker-prev-year', this.options.prev, function () {
            _this.updateYear(_this.options.date.getFullYear() - 1);
            _this.render('month');
            _this.pickerInput.focus();
        }, 'Previous year');
        header.appendChild(next);
        header.appendChild(prev);
        var tbl = document.createElement('table');
        this.calendar.appendChild(tbl);
        var _loop_1 = function (i) {
            if (i % 3 === 0) {
                var tr = document.createElement('tr');
                tbl.appendChild(tr);
            }
            var td = document.createElement('td');
            td.className = 'DatePicker-month-cell';
            var monthName = typeof this_1.options.months === 'function'
                ? this_1.options.months(i, 'short')
                : this_1.options.months[i].substring(0, 3);
            var monthLabel = typeof this_1.options.months === 'function'
                ? this_1.options.months(i, 'long')
                : this_1.options.months[i];
            var button = createButton('DatePicker-month-button', monthName, function () {
                _this.updateMonth(i);
                _this.render('day');
                _this.pickerInput.focus();
            }, "Choose ".concat(monthLabel));
            td.appendChild(button);
            var lastRow = tbl.lastChild;
            lastRow.appendChild(td);
        };
        var this_1 = this;
        for (var i = 0; i < 12; i++) {
            _loop_1(i);
        }
    };
    DatePicker.prototype.renderYearView = function () {
        var _this = this;
        var workingDate = this.getWorkingDate();
        var currentYear = workingDate.getFullYear();
        var startYear = Math.floor(currentYear / 12) * 12;
        var header = document.createElement('div');
        header.className = 'DatePicker-header';
        header.innerHTML = "".concat(startYear, " - ").concat(startYear + 11);
        this.calendar.appendChild(header);
        var next = createButton('DatePicker-next-years', this.options.next, function () {
            _this.updateYear(_this.options.date.getFullYear() + 12);
            _this.render('year');
            _this.pickerInput.focus();
        }, 'Next 12 years');
        var prev = createButton('DatePicker-prev-years', this.options.prev, function () {
            _this.updateYear(_this.options.date.getFullYear() - 12);
            _this.render('year');
            _this.pickerInput.focus();
        }, 'Previous 12 years');
        header.appendChild(next);
        header.appendChild(prev);
        var tbl = document.createElement('table');
        this.calendar.appendChild(tbl);
        var _loop_2 = function (i) {
            if (i % 3 === 0) {
                var tr = document.createElement('tr');
                tbl.appendChild(tr);
            }
            var td = document.createElement('td');
            td.className = 'DatePicker-year-cell';
            var year = startYear + i;
            var button = createButton('DatePicker-year-button', year.toString(), function () {
                _this.updateYear(year);
                _this.render('month');
                _this.pickerInput.focus();
            }, "Choose ".concat(year));
            td.appendChild(button);
            var lastRow = tbl.lastChild;
            lastRow.appendChild(td);
        };
        for (var i = 0; i < 12; i++) {
            _loop_2(i);
        }
    };
    /*!
     * From: http://www.electricprism.com/aeron/calendar/
     *
     * License:
     * MIT-style license.
     *
     * Copyright:
     * Copyright (c) 2008 [Aeron Glemann](http://www.electricprism.com/aeron/)
     *
     * @param {Date} date
     * @param {string} format
     * @returns {string}
     */
    DatePicker.prototype.format = function (date, format, utc) {
        var str = '';
        var j, w, n, y;
        if (utc) {
            j = date.getUTCDate();
            w = date.getUTCDay();
            n = date.getUTCMonth() + 1;
            y = date.getUTCFullYear() + '';
        }
        else {
            j = date.getDate();
            w = date.getDay();
            n = date.getMonth() + 1;
            y = date.getFullYear() + '';
        }
        var l = "";
        var D = "";
        if (typeof this.options.days === 'function') {
            l = this.options.days(w, "long");
            D = this.options.days(w, "short");
        }
        else {
            l = this.options.days[w];
            D = l.substr(0, 3);
        }
        var f = "";
        var M = "";
        if (typeof this.options.months === 'function') {
            f = this.options.months(n - 1, "long");
            M = this.options.months(n - 1, "short");
        }
        else {
            f = this.options.months[n - 1];
            M = f.substr(0, 3);
        }
        for (var i = 0, len = format.length; i < len; i++) {
            var cha = format.charAt(i);
            switch (cha) {
                case 'y': // xx - xx
                    str += y.substr(2);
                    break;
                case 'Y': // 19xx - 20xx
                    str += y;
                    break;
                case 'm': // 01 - 12
                    if (n < 10) {
                        str += '0' + n;
                    }
                    else {
                        str += n;
                    }
                    break;
                case 'n': // 1 - 12
                    str += n;
                    break;
                case 'M': // Jan - Dec
                    str += M;
                    break;
                case 'F': // January - December
                    str += f;
                    break;
                case 'd': // 01 - 31
                    if (j < 10) {
                        str += '0' + j;
                    }
                    else {
                        str += j;
                    }
                    break;
                case 'j': // 1 - 31
                    str += j;
                    break;
                case 'D': // Sun - Sat
                    str += D;
                    break;
                case 'l': // Sunday - Saturday
                    str += l;
                    break;
                case 'N': // 1 - 7
                    str += w + 1;
                    break;
                case 'w': // 0 - 6
                    str += w;
                    break;
                case 'S': // st, nd, rd or th (works well with j)
                    if (j % 10 == 1 && j != 11) {
                        str += 'st';
                    }
                    else if (j % 10 == 2 && j != 12) {
                        str += 'nd';
                    }
                    else if (j % 10 == 3 && j != 13) {
                        str += 'rd';
                    }
                    else {
                        str += 'th';
                    }
                    break;
                default:
                    str += cha;
            }
        }
        return str;
    };
    return DatePicker;
}());
if (typeof module !== "undefined" && module.exports) {
    module.exports = DatePicker;
}
if (typeof define === "function") {
    define([], function () {
        return DatePicker;
    });
}
