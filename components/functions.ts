import { PlayerRecord } from "@/components/playerRecord";

// https://stackoverflow.com/questions/54860670/how-to-split-a-string-containing-csv-data-with-arbitrary-text-into-a-javascript

export const parseRow = function (row: string) {
  let isInQuotes = false;
  let values = [];
  let val = "";

  for (let i = 0; i < row.length; i++) {
    switch (row[i]) {
      case ",":
        if (isInQuotes) {
          val += row[i];
        } else {
          values.push(val);
          val = "";
        }
        break;

      case '"':
        if (isInQuotes && i + 1 < row.length && row[i + 1] === '"') {
          val += '"';
          i++;
        } else {
          isInQuotes = !isInQuotes;
        }
        break;

      default:
        val += row[i];
        break;
    }
  }
  values.push(val);
  return values;
};

export const summariseRecords = (
  acc: number[],
  cur: PlayerRecord,
  sport: string
): number[] => {
  const balance = cur.balanceBaseball + cur.balanceSoftball;
  const owed = cur.amountOwedBaseball + cur.amountOwedSoftball;
  const paid = cur.amountPaidBaseball + cur.amountPaidSoftball;
  const registered = !!cur.registered;
  // CountMembers
  acc[0]++;
  // CountOutstanding
  balance && acc[1]++;
  // TotalOwed;
  acc[2] += owed;
  // TotalReceived;
  acc[3] += paid;
  // TotalOutstanding;
  acc[4] += balance;
  // CountRegistered;
  sport === ("baseball" || "all") && registered && acc[5]++;
  // CountUnregistered;
  sport === ("baseball" || "all") && !registered && acc[6]++;
  return acc;
};
