"use strict";

declare var module: { exports: any };

type OnPickCallback = (this: HTMLInputElement, picked: Date) => void;
type DayPickerCallback = (day: number, format: "long" | "short") => string;
type MonthPickerCallback = (month: number, format: "long" | "short") => string;
type UserInputParserCallback = (input: string) => Date | null;

interface OptionsInterface {
	outputFormat: string;
	days: string[] | DayPickerCallback;
	months: string[] | MonthPickerCallback;
	next: string;
	prev: string;

	date: Date;

	parseUserInput: boolean | UserInputParserCallback,

	pickerDate: Date | null;
	pickerDateUTC: boolean;

	minDate: Date | null;
	maxDate: Date | null;

	onPick: OnPickCallback;
	triggerChangeEvent: boolean;
	offsetX: number;
	offsetY: number;
}

interface Rect {
	bottom: number;
	top: number;
	left: number;
	right: number;
}

class DatePicker {

	public offset: number = 0;

	protected calendar = document.createElement('div');

	protected options: OptionsInterface = {
		outputFormat: 'Y-m-d',

		days: (day: number, format: "long" | "short"): string => {
			return new Date(1995, 1, day).toLocaleDateString(document.documentElement.lang || 'en', { weekday: format });
		},
		months: (month: number, format: "long" | "short"): string => {
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

		onPick: () => { /*....*/ },
		triggerChangeEvent: true,

		offsetX: 0,
		offsetY: 0,
	};

	/**
	 * @param {!Node} pickerElm
	 * @param {?Object} options
	 * @constructor
	 */
	constructor(protected pickerElm: HTMLInputElement, options?: Partial<OptionsInterface>) {
		this.options = { ...this.options, ...options };

		this.calendar.className = 'DatePicker';

		const body = document.querySelector('body');
		if (!body) {
			throw new Error("Failed to find body tag");
		}
		body.appendChild(this.calendar);

		let hideTimeout = 0;
		this.pickerElm.addEventListener('focus', () => {
			clearTimeout(hideTimeout);
			this.display();
		});

		this.pickerElm.addEventListener('blur', () => {
			hideTimeout = setTimeout(this.hide.bind(this), 300);
		});

		if (this.options.pickerDate !== null) {
			this.setPickerDate(this.options.pickerDate);
		} else if (this.options.parseUserInput !== false) {
			this.setPickerDate(this.pickerElm.value);
		}

		if (this.options.parseUserInput) {
			let wasInput = false;
			this.pickerElm.addEventListener('input', () => {
				wasInput = true;
			});

			this.pickerElm.addEventListener('change', () => {
				if (wasInput) {
					try {
						this.setPickerDate(this.pickerElm.value);
					} catch{
						this.setPickerDate(this.options.pickerDate)
					}
				}

				wasInput = false;
			});
		}

		this.render();
		this.hide();
	}

	protected parseUserDate(input: string): Date | null {
		if (input.trim() == '') {
			return null;
		}

		const d1 = new Date(input);
		if (isNaN(d1.getTime())) {
			const newInput = input.replace(/(\d)(?:st|nd|rd|th)/g, "$1");
			if (newInput != input) {
				return this.parseUserDate(newInput);
			}

			throw new Error('failed to parse date');
		}

		let d2 = new Date(input + " GMT-0000");
		if (isNaN(d2.getTime())) {
			d2 = d1;
		}

		if (this.options.pickerDateUTC) {
			return new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate()));
		}

		return new Date(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate());
	}

	public hide() {
		this.calendar.style.display = 'none';
	}

	public display() {
		const rect = this.pageRect(this.pickerElm);
		const bottom = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		this.calendar.style.top = (rect.bottom + this.options.offsetX) + "px";
		this.calendar.style.left = (rect.left + this.options.offsetY) + "px";
		this.calendar.style.display = 'inline-block';
		this.calendar.style.visibility = 'inherit';

		const calrect = this.calendar.getBoundingClientRect();

		if (calrect.bottom > bottom) {
			this.calendar.style.top = ((rect.top - calrect.height) + this.options.offsetX) + "px";
		}
	}

	private getDaysInMonth(date: Date): number {
		for (let i = 27; i <= 32; i++) {
			const workingDate = new Date(date.getFullYear(), date.getMonth(), i);
			if (workingDate.getMonth() != date.getMonth()) {
				return i - 1;
			}
		}

		throw new Error("Days in Month Unknown!");
	}

	/**
	 * Set the currently picked date of the picker
	 * 
	 * @param {?Date} date
	 */
	public setPickerDate(date: Date | string | null): void {
		if (typeof date === "string") {
			let userDate: Date | null;

			if (typeof this.options.parseUserInput == "function") {
				userDate = this.options.parseUserInput(date);
			} else {
				userDate = this.parseUserDate(date);
			}

			this.setPickerDate(userDate);

			return;
		}

		this.options.pickerDate = date;
		this.pickerElm.value = date ? this.format(date, this.options.outputFormat, this.options.pickerDateUTC) : '';

		if (date) {
			this.setMonth(this.options.pickerDateUTC ? date.getUTCMonth() : date.getMonth());
			this.setYear(this.options.pickerDateUTC ? date.getUTCFullYear() : date.getFullYear());
		}
	}

	/**
	 * Get the current date of the picker
	 *
	 * @return {?Date}
	 */
	public getPickerDate(): Date | null {
		return this.options.pickerDate;
	}

	/**
	 * Set the month of the calendar
	 *
	 * @param {!number} month
	 */
	public setMonth(month: number): void {
		this.options.date.setMonth(month);
		this.render();
	}

	/**
	 * Set the year of the calendar
	 *
	 * @param {!number} year
	 */
	public setYear(year: number): void {
		this.options.date.setFullYear(year);
		this.render();
	}

	/**
	 * @param {?Date} date
	 */
	public setMinDate(date: Date | null): void {
		this.options.minDate = date;
		this.render();
	}

	/**
	 * @param {?Date} date
	 */
	public setMaxDate(date: Date | null): void {
		this.options.maxDate = date;
		this.render();
	}

	/**
	 * @param callback
	 */
	public setOnPick(callback: OnPickCallback): void {
		this.options.onPick = callback;
	}

	/**
	 * Get the current calendar year and month as a Date object in local-time
	 *
	 * @returns {Date}
	 */
	public getWorkingDate(): Date {
		return (new Date(this.options.date.getFullYear(), this.options.date.getMonth(), 1));
	}

	private render(): void {
		this.calendar.innerHTML = '';

		const workingDate = this.getWorkingDate();
		const header = document.createElement('div');
		header.className = 'DatePicker-header';

		header.innerHTML = this.format(workingDate, 'F Y', false);

		this.calendar.appendChild(header);

		const next = document.createElement('span');

		next.className = 'DatePicker-next-month';
		next.innerHTML = this.options.next;

		next.addEventListener('click', () => {
			this.setMonth(this.options.date.getMonth() + 1);
			this.pickerElm.focus();
		});

		const prev = document.createElement('span');

		prev.className = 'DatePicker-prev-month';
		prev.innerHTML = this.options.prev;

		prev.addEventListener('click', () => {
			this.setMonth(this.options.date.getMonth() - 1);
			this.pickerElm.focus();
		});

		header.appendChild(next);
		header.appendChild(prev);

		const tbl = document.createElement('table');
		this.calendar.appendChild(tbl);

		const wday = workingDate.getDay() - this.offset;

		let tr = document.createElement('tr');
		tbl.appendChild(tr);

		let count = wday + 1;

		if (wday > 0) {
			const startTd = document.createElement('td');
			startTd.colSpan = wday;
			startTd.innerHTML = '&nbsp;';
			tr.appendChild(startTd);
		}

		for (let i = 1; i <= this.getDaysInMonth(this.options.date); i++) {
			const td = document.createElement('td');
			td.innerHTML = i.toString();
			td.className = 'DatePicker-date';

			let dayDate: Date;
			if (this.options.pickerDateUTC) {
				dayDate = new Date(Date.UTC(workingDate.getFullYear(), workingDate.getMonth(), i));
			} else {
				dayDate = new Date(workingDate.getFullYear(), workingDate.getMonth(), i);
			}

			if ((this.options.minDate === null || this.options.minDate <= dayDate)
				&& (this.options.maxDate === null || this.options.maxDate >= dayDate)) {
				td.addEventListener('click', ((date: Date) => {
					return () => {
						this.setPickerDate(date);
						this.options.onPick.apply(this.pickerElm, [date]);
						if (this.options.triggerChangeEvent) {
							if (this.pickerElm.dispatchEvent) { // IE9+
								const evt = document.createEvent("HTMLEvents");
								evt.initEvent('change', true, true);
								return !this.pickerElm.dispatchEvent(evt);
							}
						}

						return undefined;
					};
				})(dayDate));
			} else {
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
			const endTd = document.createElement('td');
			endTd.colSpan = 8 - count;
			endTd.innerHTML = '&nbsp;';
			tr.appendChild(endTd);
		}

	}

	private pageRect(elm: HTMLElement): Rect {
		const irect = elm.getBoundingClientRect();

		const rect = {
			bottom: irect.y - (irect.top - irect.bottom),
			top: irect.y,

			left: irect.x,
			right: irect.x - (irect.left - irect.right),
		};

		return rect;
	}

	/**
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
	private format(date: Date, format: string, utc: boolean): string {
		let str = '';

		let j: number, w: number, n: number, y: string;
		if (utc) {
			j = date.getUTCDate();
			w = date.getUTCDay();
			n = date.getUTCMonth() + 1;
			y = date.getUTCFullYear() + '';
		} else {
			j = date.getDate();
			w = date.getDay();
			n = date.getMonth() + 1;
			y = date.getFullYear() + '';
		}

		let l = "";
		let D = "";
		if (typeof this.options.days === 'function') {
			l = this.options.days(w, "long");
			D = this.options.days(w, "short");
		} else {
			l = this.options.days[w];
			D = l.substr(0, 3);
		}

		let f = "";
		let M = "";
		if (typeof this.options.months === 'function') {
			f = this.options.months(n - 1, "long");
			M = this.options.months(n - 1, "short");
		} else {
			f = this.options.months[n - 1];
			M = f.substr(0, 3);
		}

		for (let i = 0, len = format.length; i < len; i++) {
			const cha = format.charAt(i);
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
					} else {
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
					} else {
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
					} else if (j % 10 == 2 && j != 12) {
						str += 'nd';
					} else if (j % 10 == 3 && j != 13) {
						str += 'rd';
					} else {
						str += 'th';
					}
					break;
				default:
					str += cha;
			}
		}

		return str;
	}
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = DatePicker;
}

if (typeof define === "function") {
	define([], () => {
		return DatePicker;
	});
}
