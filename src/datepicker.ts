"use strict";

declare var module: { exports: any };

type OnPickCallback = (elm: HTMLInputElement) => void;
type DayPickerCallback = (day: number, format: "long" | "short") => string;
type MonthPickerCallback = (month: number, format: "long" | "short") => string;

interface OptionsInterface {
	outputFormat: string;
	days: string[] | DayPickerCallback;
	months: string[] | MonthPickerCallback;
	next: string;
	prev: string;
	date: Date;
	minDate: Date | null;
	maxDate: Date | null;
	onPick: OnPickCallback;
	triggerChangeEvent: boolean;
	offsetX: 0;
	offsetY: 0;
}

class DatePicker {

	public offset: number = 0;

	protected calendar: HTMLDivElement;

	protected options: OptionsInterface = {
		outputFormat: 'Y-m-d',
		days: (day: number, format: "long" | "short"): string => {
			return new Date(1995, 1, day).toLocaleDateString(document.documentElement.lang || 'en', { weekday: format });
		},
		months: (month: number, format: "long" | "short"): string => {
			return new Date(2000, month, 2).toLocaleDateString(document.documentElement.lang || 'en', { month: format });
		},
		next: '▶',
		prev: '◀',
		date: new Date(),
		minDate: null,
		maxDate: null,
		onPick: () => { /*....*/ },
		triggerChangeEvent: true,
		offsetX: 0,
		offsetY: 0,
	};

	/**
	 * @param {!Node} picker
	 * @param {?Object} options
	 * @constructor
	 */
	constructor(protected picker: HTMLInputElement, options?: OptionsInterface) {
		this.options = { ...this.options, ...options };

		this.calendar = document.createElement('div');
		this.calendar.className = 'DatePicker';
		const body = document.querySelector('body');
		if (!body) {
			throw new Error("Failed to find body tag");
		}
		body.appendChild(this.calendar);

		let hideTimeout = 0;
		this.picker.addEventListener('focus', () => {
			clearTimeout(hideTimeout);
			this.display();
		});

		this.picker.addEventListener('blur', () => {
			hideTimeout = setTimeout(this.hide.bind(this), 300);
		});

		this.render();
		this.hide();
	}

	public hide() {
		this.calendar.style.display = 'none';
	}

	public display() {
		const pageRect = (elm: HTMLElement) => {
			let top = 0,
				left = 0;

			const irect = elm.getBoundingClientRect();

			do {
				top += elm.offsetTop || 0;
				left += elm.offsetLeft || 0;
				elm = elm.offsetParent as HTMLElement;
			} while (elm);

			return {
				top,
				bottom: top - (irect.top - irect.bottom),
				left,
				right: left - (irect.left - irect.right),
			};
		};

		const rect = pageRect(this.picker),
			bottom = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		this.calendar.style.top = (rect.bottom + this.options.offsetX) + "px";
		this.calendar.style.left = (rect.left + this.options.offsetY) + "px";
		this.calendar.style.display = 'inline-block';
		this.calendar.style.visibility = 'inherit';

		const calrect = this.calendar.getBoundingClientRect();

		if (calrect.bottom > bottom) {
			this.calendar.style.top = ((rect.top - calrect.height) + this.options.offsetX) + "px";
		}
	}

	/**
	 * @param {!Date} date
	 * @returns {number}
	 */
	private getDaysInMonth(date: Date) {
		for (let i = 27; i <= 32; i++) {
			const workingDate = new Date(date.getFullYear(), date.getMonth(), i);
			if (workingDate.getMonth() != date.getMonth()) {
				return i - 1;
			}
		}

		throw new Error("Days in Month Unknown!");
	}

	/**
	 * @param {Date} date
	 */
	public setPickerDate(date: Date) {
		this.picker.value = this.format(date, this.options.outputFormat);
	}

	/**
	 * @param {!number} month
	 */
	public setMonth(month: number) {
		this.options.date.setMonth(month);
		this.render();
	}

	/**
	 * @param {!number} year
	 */
	public setYear(year: number) {
		this.options.date.setFullYear(year);
		this.render();
	}

	/**
	 * @param {?Date} date
	 */
	public setMinDate(date: Date | null) {
		this.options.minDate = date;
		this.render();
	}

	/**
	 * @param {?Date} date
	 */
	public setMaxDate(date: Date | null) {
		this.options.maxDate = date;
		this.render();
	}

	/**
	 * @param callback
	 */
	public setOnPick(callback: OnPickCallback) {
		this.options.onPick = callback;
	}

	/**
	 * @returns {Date}
	 */
	public getWorkingDate() {
		return (new Date(this.options.date.getFullYear(), this.options.date.getMonth(), 1));
	}

	private render() {
		const that = this;
		this.calendar.innerHTML = '';

		const workingDate = this.getWorkingDate();
		const header = document.createElement('div');
		header.className = 'DatePicker-header';

		header.innerHTML = this.format(workingDate, 'F Y');

		this.calendar.appendChild(header);

		const next = document.createElement('span');

		next.className = 'DatePicker-next-month';
		next.innerHTML = this.options.next;

		next.addEventListener('click', () => {
			this.setMonth(this.options.date.getMonth() + 1);
			this.picker.focus();
		});

		const prev = document.createElement('span');

		prev.className = 'DatePicker-prev-month';
		prev.innerHTML = this.options.prev;

		prev.addEventListener('click', () => {
			this.setMonth(this.options.date.getMonth() - 1);
			this.picker.focus();
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

			const dayDate = new Date(workingDate.getFullYear(), workingDate.getMonth(), i);

			if ((this.options.minDate === null || this.options.minDate <= dayDate) && (this.options.maxDate === null || this.options.maxDate >= dayDate)) {
				td.addEventListener('click', function(date: Date) {
					return () => {
						that.setPickerDate(date);
						that.options.onPick.apply(that.picker);
						if (that.options.triggerChangeEvent) {
							if (that.picker.dispatchEvent) { // IE9+
								const evt = document.createEvent("HTMLEvents");
								evt.initEvent('change', true, true);
								return !that.picker.dispatchEvent(evt);
							}
						}
					};
				}(dayDate));
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
	private format(date: Date, format: string) {
		let str = '';
		if (date) {
			const j = date.getDate(), w = date.getDay(),
				n = date.getMonth() + 1,
				y = date.getFullYear() + '';

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
