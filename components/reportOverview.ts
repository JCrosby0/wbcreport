export class OverviewRow {
  Sport: string;
  Date: number;
  CountMembers: number;
  CountOutstanding: number;
  TotalOwed: number;
  TotalReceived: number;
  TotalOutstanding: number;
  CountRegistered: number;
  CountUnregistered: number;

  constructor(sport: string, values: number[]) {
    this.Sport = sport;
    [
      this.CountMembers, //
      this.CountOutstanding,
      this.TotalOwed,
      this.TotalReceived,
      this.TotalOutstanding, //
      this.CountRegistered,
      this.CountUnregistered, //
    ] = values;
    const convertDate = jsUTCTimestampToGsheetsDate(Date.now());
    this.Date = Math.floor((convertDate * 10000) / 10000);
  }
}

// Defines constants in milliseconds (JavaScript's unit for dates)
const MS_PER_MINUTE = 60000; // Assumes no leap year adjustment in this minute
const MS_PER_DAY = 86400000; // Assumes no leap year adjustment in this day
const MS_PER_70YEARS_2DAYS = 2209161599801; // Diff between gSheets' & unix's "zero"

function jsUTCTimestampToGsheetsDate(millisecs: number) {
  let days = (millisecs + MS_PER_70YEARS_2DAYS) / MS_PER_DAY;
  days = Math.ceil(days * 100000) / 100000; // Rounds the result up to 5 digits
  return days;
}
