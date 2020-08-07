declare var module: {
    exports: any;
};
declare type OnPickCallback = (this: HTMLInputElement, picked: Date) => void;
declare type DayPickerCallback = (day: number, format: "long" | "short") => string;
declare type MonthPickerCallback = (month: number, format: "long" | "short") => string;
interface OptionsInterface {
    outputFormat: string;
    days: string[] | DayPickerCallback;
    months: string[] | MonthPickerCallback;
    next: string;
    prev: string;
    date: Date;
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
declare class DatePicker {
    protected picker: HTMLInputElement;
    offset: number;
    protected calendar: HTMLDivElement;
    protected options: OptionsInterface;
    /**
     * @param {!Node} picker
     * @param {?Object} options
     * @constructor
     */
    constructor(picker: HTMLInputElement, options?: Partial<OptionsInterface>);
    hide(): void;
    display(): void;
    private getDaysInMonth;
    /**
     * @param {?Date} date
     */
    setPickerDate(date: Date | null): void;
    /**
     * Get the current date of the picker
     *
     * @return {?Date}
     */
    getPickerDate(): Date | null;
    /**
     * Set the month of the calendar
     *
     * @param {!number} month
     */
    setMonth(month: number): void;
    /**
     * Set the year of the calendar
     *
     * @param {!number} year
     */
    setYear(year: number): void;
    /**
     * @param {?Date} date
     */
    setMinDate(date: Date | null): void;
    /**
     * @param {?Date} date
     */
    setMaxDate(date: Date | null): void;
    /**
     * @param callback
     */
    setOnPick(callback: OnPickCallback): void;
    /**
     * Get the current calendar year and month as a Date object in local-time
     *
     * @returns {Date}
     */
    getWorkingDate(): Date;
    private render;
    private pageRect;
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
    private format;
}
