export class PlayerRecord {
  fileIndex: number;
  name: string;
  paymentClass: string;
  groups: string;
  amountOwedBaseball: number = 0;
  amountPaidBaseball: number = 0;
  balanceBaseball: number = 0;
  amountOwedSoftball: number = 0;
  amountPaidSoftball: number = 0;
  balanceSoftball: number = 0;
  registered: boolean | null = null;
  firstName: string;
  lastName: string;
  sports: string[];
  isBaseball: boolean = false;
  isSoftball: boolean = false;
  isTeeball: boolean = false;

  constructor(
    fileIndex: number,
    name: string,
    paymentClass: string,
    groups: string
    // theAmountOwed: number,
    // theAmountPaid: number,
    // theBalance: number,
  ) {
    // this.amountOwed = theAmountOwed
    // this.amountPaid = theAmountPaid
    // this.balance = theBalance;
    this.fileIndex = fileIndex;
    this.name = name;
    this.paymentClass = paymentClass;
    this.groups = groups;
    [this.lastName, this.firstName] = name!.split(", ");
    this.sports = [];
    if (paymentClass.match(/Teeball|Tee-ball/)) {
      this.sports.push("Tee-ball");
      this.isTeeball = true;
    }
    if (paymentClass.match(/Baseball|League|IL|Machine/)) {
      this.sports.push("Baseball");
      this.isBaseball = true;
    }
    if (fileIndex === 1) {
      this.sports.push("Softball");
      this.isSoftball = true;
    }
  }
}
