<template>
  <div class="container mx-auto">
    <h1>WBC Registrar Report</h1>
    <div class="files flex flex-col">
      <div v-show="showFileLoadBox" class="fileLoadBox">
        <h2>Data to be loaded:</h2>
        <div v-for="(ds, i) in datasources" :key="'file'+i" class="revBT">
          <div v-if="playerRecords && recordsBaseball.length === 0 || recordsSoftball.length === 0" class="no-selected">
              <span>Load {{ds.label}} Data</span> -- 
            <a :href="ds.link" target="_blank">Download Link</a><br>
          </div>
          <div v-else class="selected print-hide">
            {{ds.label}} Data Loaded
          </div>
        </div>
      </div>
      <div>
        <input
          class="print-hide"
          type="file"
          autofocus
          multiple
          accept=".csv"
          @change="ev => handleFileChange(ev)"
          defaultValue="Choose File(s)"
          >
          </div>
          <span v-if="this.dates.length">
            Files downloaded: {{ formattedDates }}
          </span>
    </div>
    <!-- values report for screen display and print -->
    <div v-if="playerRecords.length > 0" class="results">
      <div v-for="report in reports" :key="report.label" class="report">

        <h2>{{report.label}}</h2>
        <ul>
          <li v-for="(_, i) in report.dataArray" :key="'membership-'+report.headingArray[i].label">
            <div class="row">
              <div class="label">
                <span>{{report.headingArray[i].label}}</span> 
              </div>
              <div v-if="report.label === 'Amount Outstanding'" class="value">
                {{ numberFormat.format(report.dataArray[i]) }}
              </div>
              <div v-else class="value">
                {{ report.dataArray[i] }}
              </div>
              <div class="tooltip print-hide">
                ℹ️
              <div class="tooltiptext">
                {{report.headingArray[i].tooltip}}
              </div>
            </div>
            </div>
          </li>
        </ul>
      </div>
    </div> 
    <!-- Explanation of filtering for print report -->
    <div class="screen-hide page-break">
      <h2>Methodology:</h2>
      <span>Five reports are downloaded and parsed</span>
        <ul class="summary">
          <li>A members report showing payment class and groups from revolutionise for both Baseball/Tee-ball and Softball.</li>
          <li>A transaction report from revolutionise showing amount owed, amount paid and balance for both Baseball/Tee-ball and Softball</li>
          <li>A membership report from Sportlomo showing actively registered players</li>
        </ul>
    <div v-if="playerRecords.length > 0" class="results">
      <div v-for="report in reports" :key="report.label" class="report">
        <h3>{{report.label}}</h3>
        <ul>
          <li v-for="(_, i) in report.dataArray" :key="'membership-'+report.headingArray[i].label">
            <div class="row">
              <div class="label">
                <span>{{report.headingArray[i].label}}</span> 
              </div>
              <div class="print-tooltip">
                {{report.headingArray[i].tooltip}}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div> 
    </div>
    <!-- TODO: set up numbers to toggle table display of data -->
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { PlayerRecord } from '@/components/playerRecord'
import { Reports } from '@/components/reports'
import { DataSource, datasources } from '@/components/dataSources'
import { Headings, headingsSports, headingsFees, headingsOutstanding, headingsRegistration } from '@/components/headings'

// https://stackoverflow.com/questions/54860670/how-to-split-a-string-containing-csv-data-with-arbitrary-text-into-a-javascript
let parseRow = function(row: string) {
  let isInQuotes = false;
  let values = [];
  let val = '';

  for (let i = 0; i < row.length; i++) {
    switch (row[i]) {
      case ',':
        if (isInQuotes) {
          val += row[i];
        } else {
          values.push(val);
          val = '';
        }
        break;

      case '"':
        if (isInQuotes && i + 1 < row.length && row[i+1] === '"') {
          val += '"'; 
          i++;
        } else {
          isInQuotes = !isInQuotes
        }
        break;

      default:
        val += row[i];
        break;
    }
  }

  values.push(val);

  return values;
}

export default Vue.extend({
  name: 'ReportPage',
  data() {
    return {
      numberFormat: Intl.NumberFormat(
        'en-US', 
        {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }),
      dates: [] as Date[],
      datasources: [...datasources] as DataSource[],
      showFileLoadBox: true,
      sportlomoNotRevolutionise: [] as string[],
      transactionsNotPlayerRecord: [] as string[][],
      playerRecords: [] as PlayerRecord[],
      headingsSports: headingsSports as Headings[],
      headingsFees: headingsFees as Headings[],
      headingsOutstanding: headingsOutstanding as Headings[],
      headingsRegistration: headingsRegistration as Headings[],
    }
  },
  computed: {
    formattedDates() {
      return `${this.dates[0].getDate()}/${this.dates[0].getMonth()} - ${this.dates[1].getDate()}/${this.dates[1].getMonth()}/${this.dates[1].getFullYear()}`
    },
    reports() {
      return [
        // new Reports('Player Records', this.records, this.headingsSports),
        new Reports('Membership Numbers', this.members, this.headingsSports),
        new Reports('Members with Outstanding Fees', this.fees, this.headingsFees),
        new Reports('Amount Outstanding', this.outstanding, this.headingsOutstanding),
        new Reports('Members with Outstanding Registration', this.registration, this.headingsRegistration)
     ]
    },
    // PLAYER RECORDS
    recordsBaseball(): PlayerRecord[] {
      return this.playerRecords.filter((p: PlayerRecord) => p.sports.includes('Baseball')) || []
    },
    recordsSoftball(): PlayerRecord[] {
      return this.playerRecords.filter((p: PlayerRecord) => p.sports.includes('Softball')) || []
    },
    recordsTeeball(): PlayerRecord[] {
      return this.playerRecords.filter((p: PlayerRecord) => p.sports.includes('Tee-ball')) || []
    },


    // MEMBERS
    membersBaseball(): number | string {
      return this.recordsBaseball.length
    },
    membersSoftball(): number | string {
      return this.recordsSoftball.length
    },
    membersTeeball(): number | string {
      return this.recordsTeeball.length
    },
    membersTeeballU6(): number | string {
      return this.recordsTeeball.filter((p: PlayerRecord) => {
          return p.paymentClass.match(/Teeball under 6/)
        }).length
    },
    membersTeeballBaseball(): number | string {
      return this.recordsBaseball
        .filter((p: PlayerRecord) => this.recordsTeeball.includes(p))
        .length
    },
    membersTotal(): number | string {
      return +this.membersBaseball + +this.membersSoftball + +this.membersTeeball - +this.membersTeeballBaseball
    },
    members(): Array<string|number> {
      return [this.membersBaseball, this.membersSoftball, this.membersTeeball, this.membersTeeballU6, this.membersTeeballBaseball, this.membersTotal]
    },

    // FEES
    feesBaseball(): number | string  {
      return this.recordsBaseball
        .filter((f: PlayerRecord) => f.balanceBaseball > 0)
        .length
    },
    feesSoftball(): number | string  {
      return this.recordsSoftball
        .filter((f: PlayerRecord) => f.balanceSoftball > 0)
        .length
    },
    feesTeeball(): number | string  {
      return this.recordsTeeball
      .filter((f: PlayerRecord) => f.balanceBaseball > 0)
      .length
    },
    feesBaseballInvoiced(): number | string  {
      return this.recordsBaseball.filter((p: PlayerRecord) => {
          return p.paymentClass.match(/Invoiced.*(?:Baseball|League).*/) && p.balanceBaseball > 0
        }).length
    },
    feesBaseballPart(): number | string  {
      return this.recordsBaseball.filter((p: PlayerRecord) => {
          return p.paymentClass.match(/Part Paid.*(?:Baseball|League).*/) && p.balanceBaseball > 0
        }).length
    },
    feesBaseballSenior(): number | string  {
      return this.recordsBaseball
      .filter((p: PlayerRecord) => {
          return p.paymentClass.match(/(?:Invoiced|Part Paid).*Baseball.*/) && p.balanceBaseball > 0
        }).length
    },
    fees(): Array<string|number> {
      return [this.feesBaseball, this.feesSoftball, this.feesTeeball, this.feesBaseballInvoiced, this.feesBaseballPart, this.feesBaseballSenior]
    },

    // AMOUNT OUTSTANDING
    amountOutstandingBaseball(): number {
      return this.recordsBaseball
        .reduce((a: number, c: PlayerRecord) => { return a + +c.balanceBaseball }, 0)
    },
    amountOutstandingSoftball(): number {
      return this.recordsSoftball
        .reduce((a: number, c: PlayerRecord) => { return a + +c.balanceSoftball }, 0)
    },
    amountOutstandingTeeball(): number {
      return this.recordsTeeball
        .reduce((a: number, c: PlayerRecord) => { return a + +c.balanceBaseball }, 0)
    },
    outstanding(): number[] {
      return [this.amountOutstandingBaseball, this.amountOutstandingSoftball, this.amountOutstandingTeeball]
    },

    // REGISTRATION
    registrationBaseball(): number  {
      return this.recordsBaseball
        .filter((r: PlayerRecord) => r.registered !== true).length
    },
    // softballers have to be fully registered to appear in revolutionise
    registrationSoftball(): number {
      return 0
    },
    // tee-ballers only register with the club
    registrationTeeball(): number {
      return 0
    },
    registration(): Array<string|number> {
      return [this.registrationBaseball, this.sportlomoNotRevolutionise.length]
    }

  },
  methods: {
    async handleFileChange (event: Event, f: number = 0) {
      const target = event.target as HTMLInputElement;
      const files = target.files as FileList
      this.dates = Array
        .from(files)
        .reduce((a, c) => a = [Math.min(a[0], c.lastModified), Math.max(a[1], c.lastModified)], [9999999999999, 0])
        .map(d => new Date(d))
      
      const readFile = async (ev: Event, reader: FileReader, fileIndex: number) => {
        let theCSV = reader.result as string
        let theRows = theCSV.split(/\r?\n|\r/);
        let theCols = theRows.map(c => parseRow(c))
        // if last row is different length. fix parsing or omit
        let len = theCols.length
        if (theCols[0].length !== theCols[len-1].length) {
          theCols = theCols.slice(0, len-1)
        }
        // specific handling for sportlomo file - select relevant columns
        if (fileIndex === 2) {
          theCols = theCols.map(row => {
            return [row[4] + ", " + row[3], row[7]]
          })
        }
        return theCols
      }

      const parsePlayerRecords = async () => {
        for (let i = 0; i < files!.length; i++) {
          const file = files![i];
          let fileIndex: number
          // Select only the relevant files
          if (file.name.match(/ClubWildcats.*Member/)) { fileIndex = 1 } // softball membership
          else if (file.name.match(/Club.*Member/)) { fileIndex = 0 } // baseball membership
          else continue; // this routine doesn't handle the other three files
          
          const reader = new FileReader();
          // assign function to the onload event
          reader.onload = (ev: Event) => {
            readFile(ev, reader, fileIndex)
              // specific handling for player records
              .then((theCols) => {
                theCols.forEach((row, i) => {
                  if (row[0] === 'Name') return // ignore header row
                  this.playerRecords.push(new PlayerRecord(fileIndex, row[0], row[1], row[2]))
                })
              })
          }
          // read the file, triggering the onload event
          await reader.readAsText(file)
        }
        return
      }
      
      const parseTransactions = async () => {
        for (let i = 0; i < files!.length; i++) {
          const file = files![i];
          let fileIndex: number
          if (file.name.match(/ClubWildcats.*Transactions/)) { fileIndex = 4 } 
          else if (file.name.match(/Club.*Transactions/)) { fileIndex = 3 }
          else continue; // this routine doesn't handle the other three files

          const reader = new FileReader();
          // assign function to the onload event
          reader.onload = (ev: Event) => {
            readFile(ev, reader, fileIndex)
            // specific handling for player records
            .then((theCols) => {
              theCols.forEach((row, i) => {
                if (['Member', 'Total'].includes(row[0])) { return } // ignore header & footer rows
                const playerName = row[0]
                const index = this.playerRecords.findIndex((p: PlayerRecord) => p.name.toLowerCase() === playerName.toLowerCase())
                const record = this.playerRecords[index]
                if (record) {
                  if (fileIndex === 3) {
                    record.amountOwedBaseball = +row[1]
                    record.amountPaidBaseball = +row[2]
                    record.balanceBaseball = +row[3]
                  }
                  if (fileIndex === 4) {
                    record.amountOwedSoftball = +row[1]
                    record.amountPaidSoftball = +row[2]
                    record.balanceSoftball = +row[3]
                  }

                  Vue.set(this.playerRecords, index, record)
                } else {
                  if (+row[1] > 0) {
                    this.transactionsNotPlayerRecord.push(row)
                  }
                }
              })
            })
          }
          reader.readAsText(file)
        }
        return
      }

      const parseBaseballRegistration = async () => {
        for (let i = 0; i < files!.length; i++) {
          const file = files![i];
          let fileIndex = NaN as number
          // enable multiple file select/upload, and index them correctly
          if (file.name.match(/member/)) { fileIndex = 2 } // sportlomo file
          else continue

          const reader = new FileReader();
          // assign function to the onload event
          reader.onload = (ev: Event) => {
            readFile(ev, reader, fileIndex)
            // specific handling for player records
              .then((theCols) => {
                theCols
                  .forEach((row) => {
                    const playerName = row[0]
                    const index = this.playerRecords.findIndex((p: PlayerRecord) => p.name.toLowerCase() === playerName.toLowerCase())
                    const record = this.playerRecords[index]
                    if (record) {
                      record.registered = true
                      Vue.set(this.playerRecords, index, record)
                    } else {
                      this.sportlomoNotRevolutionise.push(row[0])
                    }
                })
              })
          }
          // read the file, triggering the onload event
          reader.readAsText(file)
        }
        return
      }

      // playerRecords have to be completed before the others can be executed
      const records = await parsePlayerRecords()
      const transactions = parseTransactions()
      const registration = parseBaseballRegistration()
      setTimeout(() => { this.showFileLoadBox = false }, 1500)
      
    }
  }
})
</script>

<style scoped>
h1 {
  @apply text-3xl pt-3;
}
h2 {
  @apply text-2xl pt-2;
}
h3 {
  @apply text-xl pt-1;
}
.files div.revBT {
  @apply border border-gray-600 p-2;
}
.label {
  @apply w-44;
}
.value {
  @apply w-20 text-right;
}
.row {
  @apply flex flex-row;
}
.tooltip {
  position: relative;
  display: inline-block;
  padding-left: 1rem;
  /* border-bottom: 1px dotted black; If you want dots under the hoverable text */
}
.tooltip .tooltiptext {
  visibility: hidden;
  width: 350px;
  background-color: #555;
  color: #fff;
  text-align: left;
  padding: 5px;
  border-radius: 6px;

  /* Position the tooltip text */
  position: absolute;
  z-index: 1;
  bottom: 50%;
  left: 100%;
  margin-left: 10px;
  transform: translateY(50%);

  /* Fade in tooltip */
  opacity: 0;
  transition: opacity 0.3s;
}

/* Tooltip arrow */
.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 0%;
  margin-left: -10px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent #555 transparent transparent;
}

/* Show the tooltip text when you mouse over the tooltip container */
.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}

ul.summary {
  list-style-type: circle;
  padding-left: 2rem;
}
/* ul.summary li {
  margin-left: 1rem;
}
ul.summary li::before {
  content: ">";
  margin-right: 1rem;
  margin-left: -1rem;
  width: 0;
} */

.print-tooltip {
  @apply w-full;
}
@media print {
  .print-hide {
    display: none;
  }
  .page-break {
    page-break-before: always; 
  }
}
@media screen {
  .screen-hide {
    display: none;
  }
}
</style>
