declare type OnPickCallback = (elm: HTMLInputElement) => void;
interface OptionsInterface {
    outputFormat: string;
    days: string[];
    months: string[];
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
    constructor(picker: HTMLInputElement, options?: OptionsInterface);
    hide(): void;
    display(): void;
    /**
     * @param {!Date} date
     * @returns {number}
     */
    private getDaysInMonth(date);
    /**
     * @param {Date} date
     */
    setPickerDate(date: Date): void;
    /**
     * @param {!number} month
     */
    setMonth(month: number): void;
    /**
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
     * @returns {Date}
     */
    getWorkingDate(): Date;
    private render();
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
    private format(date, format);
}
