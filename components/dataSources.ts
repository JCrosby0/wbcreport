export class DataSource {
  link: string;
  defaultFileName: string;
  label: string;
  fileIndex: number;

  constructor(
    label: string,
    defaultFileName: string,
    link: string,
    fileIndex: number
  ) {
    this.link = link
    this.defaultFileName = defaultFileName
    this.label = label
    this.fileIndex = fileIndex
  }
}

export const datasources = [
  new DataSource (
    "Revolutionise (Baseball/Tee-ball) Member List",
    'revolutionise-WillettonBaseballClub--Member-Report.csv',
    'https://client.revolutionise.com.au/wbcwildcats/members/reports/', // baseball member report
    0
  ),
  new DataSource (
    "Revolutionise (Softball) Member List",
    'revolutionise-WillettonBaseballClubWildcats--Member-Report.csv',
    'https://client.revolutionise.com.au/willettonbcwildcats/members/reports/',
    1
  ),
  new DataSource (
    "Sportlomo Member List",
    'member-export.csv', // sportlomo
    'https://admin.sportsmanager.ie/sportlomo/user/membership-management/member-export?_method=POST&FilterForm%5Bmember_id%5D=&FilterForm%5Bfirst_name%5D=&FilterForm%5Blast_name%5D=&FilterForm%5Bseason_id%5D=217&FilterForm%5Bassoc%5D%5B0%5D%5Bgov_body_id%5D=&FilterForm%5Bmembership_status%5D=50', // sportlomo report - will trigger direct download
    2
  ),
  new DataSource (
    "Revolutionise (Baseball) Transaction Report",
    'revolutioniseSPORT-WillettonBaseballClub-Transactions-Report.csv', // Baseball paid/owing
    'https://client.revolutionise.com.au/wbcwildcats/finance/reports/#start', // baseball member paid/owing report report
    3
  ),
  new DataSource (
    "Revolutionise (Softball) Transaction Report",
    'revolutioniseSPORT-WillettonBaseballClubWildcats-Transactions-Report', // Softball paid/owing
    'https://client.revolutionise.com.au/willettonbcwildcats/finance/reports/#start', //softball member paid/owing report
    4
  )
]
