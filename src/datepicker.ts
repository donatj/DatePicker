"use strict";

declare var module: { exports: any };

type OnPickCallback = (this: HTMLInputElement, picked: Date) => void;
type DayPickerCallback = (day: number, format: "long" | "short") => string;
type MonthPickerCallback = (month: number, format: "long" | "short") => string;
type UserInputParserCallback = (input: string) => Date | null;
const HIDE_DELAY_MS = 300;

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

	parentNode: HTMLElement;
}

interface Rect {
	bottom: number;
	top: number;
	left: number;
	right: number;

	height(): number;
}

type PickerView = 'day' | 'month' | 'year';

function createButton(className: string, text: string, onClick: () => void, ariaLabel?: string): HTMLButtonElement {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = className;
	button.textContent = text;
	if (ariaLabel) {
		button.setAttribute('aria-label', ariaLabel);
	}
	button.addEventListener('click', onClick);
	return button;
}

function getDaysInMonth(date: Date): number {
	for (let i = 27; i <= 32; i++) {
		const workingDate = new Date(date.getFullYear(), date.getMonth(), i);
		if (workingDate.getMonth() !== date.getMonth()) {
			return i - 1;
		}
	}

	throw new Error("Days in Month Unknown!");
}

function pageRect(elm: HTMLElement): Rect {
	const irect = elm.getBoundingClientRect();

	return new class {
		public bottom = irect.bottom + window.scrollY;
		public top =  irect.y + window.scrollY;

		public left = irect.x - window.scrollX;
		public right = irect.right - window.scrollX;

		public height() : number {
			return this.bottom - this.top;
		}
	}();
}

class DatePicker {

	public offset: number = 0;

	protected calendar = document.createElement('div');
	protected hideTimeout = 0;

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

		parentNode: document.body,
	};

	/**
	 * @param {!Node} pickerInput
	 * @param {?Object} options
	 * @constructor
	 */
	constructor(protected pickerInput: HTMLInputElement, options?: Partial<OptionsInterface>) {
		this.options = { ...this.options, ...options };

		this.calendar.className = 'DatePicker';

		if (!this.options.parentNode) {
			throw new Error("Failed to find parent node");
		}

		this.pickerInput.addEventListener('focus', () => {
			clearTimeout(this.hideTimeout);
			this.display();
		});

		this.pickerInput.addEventListener('blur', () => {
			this.scheduleHide();
		});

		this.calendar.addEventListener('focusin', () => {
			clearTimeout(this.hideTimeout);
		});

		this.calendar.addEventListener('focusout', () => {
			this.scheduleHide();
		});

		let scrollTimeout = 0;
		document.addEventListener('scroll', () => {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(this.updatePosition.bind(this), 1000);
		}, true);

		if (this.options.pickerDate !== null) {
			this.setPickerDate(this.options.pickerDate);
		} else if (this.options.parseUserInput !== false) {
			this.setPickerDate(this.pickerInput.value);
		}

		if (this.options.parseUserInput) {
			let wasInput = false;
			this.pickerInput.addEventListener('input', () => {
				wasInput = true;
			});

			this.pickerInput.addEventListener('change', () => {
				if (wasInput) {
					try {
						this.setPickerDate(this.pickerInput.value);
					} catch {
						this.setPickerDate(this.options.pickerDate)
					}
				}

				wasInput = false;
			});
		}

		this.render();
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
		if (this.calendar.parentNode !== null) {
			this.calendar.parentNode.removeChild(this.calendar);
		}
	}

	public display() {
		if (this.calendar.parentNode === null) {
			this.render('day');
			this.options.parentNode.appendChild(this.calendar);
		}

		this.updatePosition();
	}

	private scheduleHide(): void {
		clearTimeout(this.hideTimeout);
		this.hideTimeout = window.setTimeout(() => {
			const activeElement = document.activeElement;
			if (activeElement !== this.pickerInput && (activeElement === null || !this.calendar.contains(activeElement))) {
				this.hide();
			}
		}, HIDE_DELAY_MS);
	}

	private updatePosition() {
		if (this.calendar.parentNode === null) {
			return;
		}

		const pickerRect = pageRect(this.pickerInput);
		const pageBottom = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + window.scrollY;
		const top = Math.max(
			Math.max(pickerRect.bottom + this.options.offsetX, 0), window.scrollY
		);

		this.calendar.style.top = `${top}px`;
		this.calendar.style.left = `${pickerRect.left + this.options.offsetY}px`;
		this.calendar.style.display = 'inline-block';
		this.calendar.style.visibility = 'inherit';

		let calRect = pageRect(this.calendar);
		if (calRect.bottom > pageBottom) {
			this.calendar.style.top = `${(pickerRect.top - calRect.height()) + this.options.offsetX}px`;
		}

		calRect = pageRect(this.calendar);
		if (calRect.bottom > pageBottom) {
			this.calendar.style.top = `${pageBottom - calRect.height()}px`;
		}
	}

	private getDateMonth(date: Date): number {
		return this.options.pickerDateUTC ? date.getUTCMonth() : date.getMonth();
	}

	private getDateYear(date: Date): number {
		return this.options.pickerDateUTC ? date.getUTCFullYear() : date.getFullYear();
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
		this.pickerInput.value = date ? this.format(date, this.options.outputFormat, this.options.pickerDateUTC) : '';

		if (date) {
			this.updateMonth(this.getDateMonth(date));
			this.updateYear(this.getDateYear(date));
		}

		this.render();
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
		this.updateMonth(month);
		this.render();
	}

	/**
	 * Set the year of the calendar
	 *
	 * @param {!number} year
	 */
	public setYear(year: number): void {
		this.updateYear(year);
		this.render();
	}

	private updateMonth(month: number): void {
		this.options.date.setMonth(month);
	}

	private updateYear(year: number): void {
		this.options.date.setFullYear(year);
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

	private render(view: PickerView = 'day'): void {
		this.calendar.innerHTML = '';

		if (view === 'day') {
			this.renderDayView();
		} else if (view === 'month') {
			this.renderMonthView();
		} else if (view === 'year') {
			this.renderYearView();
		}

		this.updatePosition();
	}

	private renderDayView(): void {
		const workingDate = this.getWorkingDate();
		const header = document.createElement('div');
		header.className = 'DatePicker-header';

		const monthButton = createButton(
			'DatePicker-month-label',
			this.format(workingDate, 'F', false),
			() => {
				this.render('month');
				this.pickerInput.focus();
			},
			'Choose month'
		);

		const yearButton = createButton(
			'DatePicker-year-label',
			this.format(workingDate, 'Y', false),
			() => {
				this.render('year');
				this.pickerInput.focus();
			},
			'Choose year'
		);

		header.appendChild(monthButton);
		header.appendChild(yearButton);

		this.calendar.appendChild(header);

		const next = createButton('DatePicker-next-month', this.options.next, () => {
			this.updateMonth(this.options.date.getMonth() + 1);
			this.render('day');
			this.pickerInput.focus();
		}, 'Next month');

		const prev = createButton('DatePicker-prev-month', this.options.prev, () => {
			this.updateMonth(this.options.date.getMonth() - 1);
			this.render('day');
			this.pickerInput.focus();
		}, 'Previous month');

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

		for (let i = 1; i <= getDaysInMonth(this.options.date); i++) {
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
						this.options.onPick.apply(this.pickerInput, [date]);
						if (this.options.triggerChangeEvent) {
							if (this.pickerInput.dispatchEvent) { // IE9+
								const evt = document.createEvent("HTMLEvents");
								evt.initEvent('change', true, true);
								return !this.pickerInput.dispatchEvent(evt);
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

	private renderMonthView(): void {
		const workingDate = this.getWorkingDate();
		const header = document.createElement('div');
		header.className = 'DatePicker-header';

		const yearButton = createButton(
			'DatePicker-year-label',
			this.format(workingDate, 'Y', false),
			() => {
				this.render('year');
				this.pickerInput.focus();
			},
			'Choose year'
		);

		header.appendChild(yearButton);
		this.calendar.appendChild(header);

		const next = createButton('DatePicker-next-year', this.options.next, () => {
			this.updateYear(this.options.date.getFullYear() + 1);
			this.render('month');
			this.pickerInput.focus();
		}, 'Next year');

		const prev = createButton('DatePicker-prev-year', this.options.prev, () => {
			this.updateYear(this.options.date.getFullYear() - 1);
			this.render('month');
			this.pickerInput.focus();
		}, 'Previous year');

		header.appendChild(next);
		header.appendChild(prev);

		const tbl = document.createElement('table');
		this.calendar.appendChild(tbl);

		for (let i = 0; i < 12; i++) {
			if (i % 3 === 0) {
				const tr = document.createElement('tr');
				tbl.appendChild(tr);
			}

			const td = document.createElement('td');
			td.className = 'DatePicker-month-cell';

			const monthName = typeof this.options.months === 'function'
				? this.options.months(i, 'short')
				: this.options.months[i].substring(0, 3);
			const monthLabel = typeof this.options.months === 'function'
				? this.options.months(i, 'long')
				: this.options.months[i];

			const button = createButton('DatePicker-month-button', monthName, () => {
				this.updateMonth(i);
				this.render('day');
				this.pickerInput.focus();
			}, `Choose ${monthLabel}`);

			td.appendChild(button);

			const lastRow = tbl.lastChild as HTMLTableRowElement;
			lastRow.appendChild(td);
		}
	}

	private renderYearView(): void {
		const workingDate = this.getWorkingDate();
		const currentYear = workingDate.getFullYear();
		const startYear = Math.floor(currentYear / 12) * 12;

		const header = document.createElement('div');
		header.className = 'DatePicker-header';
		header.innerHTML = `${startYear} - ${startYear + 11}`;

		this.calendar.appendChild(header);

		const next = createButton('DatePicker-next-years', this.options.next, () => {
			this.updateYear(this.options.date.getFullYear() + 12);
			this.render('year');
			this.pickerInput.focus();
		}, 'Next 12 years');

		const prev = createButton('DatePicker-prev-years', this.options.prev, () => {
			this.updateYear(this.options.date.getFullYear() - 12);
			this.render('year');
			this.pickerInput.focus();
		}, 'Previous 12 years');

		header.appendChild(next);
		header.appendChild(prev);

		const tbl = document.createElement('table');
		this.calendar.appendChild(tbl);

		for (let i = 0; i < 12; i++) {
			if (i % 3 === 0) {
				const tr = document.createElement('tr');
				tbl.appendChild(tr);
			}

			const td = document.createElement('td');
			td.className = 'DatePicker-year-cell';
			const year = startYear + i;

			const button = createButton('DatePicker-year-button', year.toString(), () => {
				this.updateYear(year);
				this.render('month');
				this.pickerInput.focus();
			}, `Choose ${year}`);

			td.appendChild(button);

			const lastRow = tbl.lastChild as HTMLTableRowElement;
			lastRow.appendChild(td);
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
