import DatePicker from "basic-datepicker";

declare const input: HTMLInputElement;
const picker = new DatePicker(input);
picker.setPickerDate(null);
