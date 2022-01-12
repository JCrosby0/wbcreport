<template>
  <div class="container mx-auto">
    <h1>WBC Registrar Report</h1>
    <div class="files flex flex-col">
      <div v-show="showFileLoadBox" class="fileLoadBox">
        <h2>Data to be loaded:</h2>
        <p>Note: They all require log-in, and cannot log in to both baseball and softball revo accounts in the same browser simultaneously.</p>
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
      <div v-for="(report, i) in reports" :key="report.label" class="report">
        <!-- report start -->
        <h2>{{report.label}}</h2>
        <ul>
          <li 
            v-for="(line, j) in report.dataArray" 
            :key="'membership-'+report.headingArray[j].label">
            <!-- row start -->
            <div 
              class="row cursor-pointer" 
              @click="toggleRow(i, j)">
              <div class="row-summary">
                <div :class="{ 'print-hide': true, 'open': showRows[i][j] }" >
                  <span class="pr-2">{{showRows[i][j] ? "&#8964;" : "&#8250;" }}</span>
                </div>
                <div class="label">
                  <span>{{report.headingArray[j].label}}</span> 
                </div>
                <div v-if="report.label === 'Amount Outstanding'" class="value">
                  {{ numberFormat.format(line.balanceOutstanding) }}
                </div>
                <div v-else class="value">
                  {{ line.length }}
                </div>
                <div class="tooltip print-hide">
                  <span>ℹ️</span>
                  <div class="tooltiptext">
                    {{report.headingArray[j].tooltip}}
                  </div>
                </div>
              </div>
              <div v-if="showRows[i][j]" class="row-detail bg-gray-100">
                <table>
                  <tr><th>Player</th><th>Payment Class</th><th>Balance Outstanding</th></tr>
                  <tr
                    v-for="(player, k) in line.dataArray" 
                    :key="'player'+i+j+k" 
                  >
                    <td 
                      v-for="(cell,l) in extractData(player)" 
                      :key="'cell'+i+j+k+l">
                      <span class="capitalize">
                        {{cell}}
                      </span>
                    </td>
                  </tr>
                </table>
                <div 
                  class="detail-row">
                </div>
              </div>
            </div>
            <!-- row end -->
          </li>
        </ul>
        <!-- report end -->
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
        <div v-for="(report) in reports" :key="report.label" class="report">
          <h3>{{report.label}}</h3>
          <ul>
            <li 
              v-for="(_, j) in report.dataArray" 
              :key="'membership-'+report.headingArray[j].label">
              <div class="row">
                <div class="label">
                  <span>{{report.headingArray[j].label}}</span> 
                </div>
                <div class="print-tooltip">
                  {{report.headingArray[j].tooltip}}
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
import { Reports, ReportLineItem } from '@/components/reports'
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
      sportlomoNotRevolutionise: [] as PlayerRecord[],
      showRows: [
        Array(6).fill(false),
        Array(6).fill(false),
        Array(3).fill(false),
        Array(2).fill(false)] as boolean[][],
      transactionsNotPlayerRecord: [] as string[][],
      playerRecords: [] as PlayerRecord[],
      headingsSports: headingsSports as Headings[],
      headingsFees: headingsFees as Headings[],
      headingsOutstanding: headingsOutstanding as Headings[],
      headingsRegistration: headingsRegistration as Headings[],
    }
  },
  computed: {
    formattedDates(): string {
      console.log('dates: ', this.dates)
      if (this.dates[0].getDate() === this.dates[1].getDate()) {
        return `${this.dates[1].getDate()}/${this.dates[1].getMonth()+1}/${this.dates[1].getFullYear()}`
      }
      return `${this.dates[0].getDate()}/${this.dates[0].getMonth()+1} - ${this.dates[1].getDate()}/${this.dates[1].getMonth()+1}/${this.dates[1].getFullYear()}`
    },

    // PLAYER RECORDS
    recordsBaseball(): PlayerRecord[] {
      return this.playerRecords
        .filter((p: PlayerRecord) => p.sports.includes('Baseball')) || []
    },
    recordsSoftball(): PlayerRecord[] {
      return this.playerRecords
        .filter((p: PlayerRecord) => p.sports.includes('Softball')) || []
    },
    recordsTeeball(): PlayerRecord[] {
      return this.playerRecords
        .filter((p: PlayerRecord) => p.sports.includes('Tee-ball')) || []
    },


    // MEMBERS
    membersBaseball(): PlayerRecord[] {
      return this.recordsBaseball
    },
    membersSoftball(): PlayerRecord[] {
      return this.recordsSoftball
    },
    membersTeeball(): PlayerRecord[] {
      return this.recordsTeeball
    },
    membersTeeballU6(): PlayerRecord[] {
      return this.recordsTeeball
        .filter((p: PlayerRecord) => {
          return p.paymentClass.match(/Teeball under 6/)
        })
    },
    membersTeeballBaseball(): PlayerRecord[] {
      return this.recordsBaseball
        .filter((p) => this.recordsTeeball.includes(p))
    },
    membersTotal(): PlayerRecord[] {
      return this.playerRecords
    },
    members(): ReportLineItem[] {
      return [
        new ReportLineItem(this.membersBaseball), 
        new ReportLineItem(this.membersSoftball), 
        new ReportLineItem(this.membersTeeball), 
        new ReportLineItem(this.membersTeeballU6), 
        new ReportLineItem(this.membersTeeballBaseball), 
        new ReportLineItem(this.membersTotal)
      ]
    },

    // FEES
    feesBaseball(): PlayerRecord[]  {
      return this.recordsBaseball
        .filter((f: PlayerRecord) => f.balanceBaseball > 0)
        
    },
    feesSoftball(): PlayerRecord[]  {
      return this.recordsSoftball
        .filter((f: PlayerRecord) => f.balanceSoftball > 0)
        
    },
    feesTeeball(): PlayerRecord[] {
      return this.recordsTeeball
        .filter((f: PlayerRecord) => f.balanceBaseball > 0)
      
    },
    feesBaseballInvoiced(): PlayerRecord[]  {
      return this.recordsBaseball
        .filter((p: PlayerRecord) => {
          return p.paymentClass.match(/Invoiced.*(?:Baseball|League).*/) && p.balanceBaseball > 0
        })
    },
    feesBaseballPart(): PlayerRecord[]  {
      return this.recordsBaseball
        .filter((p: PlayerRecord) => {
          return p.paymentClass.match(/Part Paid.*(?:Baseball|League).*/) && p.balanceBaseball > 0
        })
    },
    feesBaseballSenior(): PlayerRecord[]  {
      return this.recordsBaseball
      .filter((p: PlayerRecord) => {
          return p.paymentClass.match(/(?:Invoiced|Part Paid).*Baseball.*/) && p.balanceBaseball > 0
        })
    },
    fees(): ReportLineItem[] {
      return [
        new ReportLineItem(this.feesBaseball), 
        new ReportLineItem(this.feesSoftball), 
        new ReportLineItem(this.feesTeeball), 
        new ReportLineItem(this.feesBaseballInvoiced), 
        new ReportLineItem(this.feesBaseballPart), 
        new ReportLineItem(this.feesBaseballSenior)
      ]
    },

    // AMOUNT OUTSTANDING
    amountOutstandingBaseball(): PlayerRecord[] {
      return this.recordsBaseball
        .filter((f: PlayerRecord ) => (f.balanceBaseball > 0))
    },
    amountOutstandingSoftball(): PlayerRecord[] {
      return this.recordsSoftball
        .filter((f: PlayerRecord ) => (f.balanceSoftball > 0))
    },
    amountOutstandingTeeball(): PlayerRecord[] {
      return this.recordsTeeball
        .filter((f: PlayerRecord ) => (f.balanceBaseball > 0))
    },
    outstanding(): ReportLineItem[] {
      return [
        new ReportLineItem(this.amountOutstandingBaseball, 'baseball'), 
        new ReportLineItem(this.amountOutstandingSoftball, 'softball'), 
        new ReportLineItem(this.amountOutstandingTeeball, 'baseball')
        ]
    },

    // REGISTRATION
    registrationBaseball(): PlayerRecord[]  {
      return this.recordsBaseball
        .filter((r: PlayerRecord) => r.registered !== true)
    },
    // // softballers have to be fully registered to appear in revolutionise
    // registrationSoftball(): number {
    //   return 0
    // },
    // // tee-ballers only register with the club
    // registrationTeeball(): number {
    //   return 0
    // },
    registration(): ReportLineItem[] {
      return [
        new ReportLineItem(this.registrationBaseball), 
        new ReportLineItem(this.sportlomoNotRevolutionise)
      ]
    },

    reports(): Reports[] {
      return [
        // new Reports('Player Records', this.records, this.headingsSports),
        new Reports('Membership Numbers', this.members, this.headingsSports),
        new Reports('Members with Outstanding Fees', this.fees, this.headingsFees),
        new Reports('Amount Outstanding', this.outstanding, this.headingsOutstanding),
        new Reports('Members with Outstanding Registration', this.registration, this.headingsRegistration)
     ]
    },

  },
  methods: {
    //extract Data from a PlayerRecord and format it for display
    extractData(rec: PlayerRecord): string[] {
      const name = rec.name as string
      const paymentClass = rec.paymentClass as string
      const balance = "$"+(+rec.balanceBaseball + +rec.balanceSoftball) as string
      return [name, paymentClass, balance]
    },

    toggleRow(reportIndex: number, lineItemIndex: number) {
      console.log('reportIndex: ', reportIndex)
      console.log('lineItemIndex: ', lineItemIndex)
      // const currentValue = this.reports[reportIndex].dataArray[lineItemIndex].showContent as boolean
      // console.log('currentValue: ', currentValue)
      // const newValue = !currentValue
      // console.log('newValue: ', newValue)
      // this.$set(
      //   this.reports[reportIndex].dataArray[lineItemIndex], 
      //   'showContent', 
      //   !this.reports[reportIndex].dataArray[lineItemIndex].showContent
      // )
      this.$set(this.showRows[reportIndex], lineItemIndex, !this.showRows[reportIndex][lineItemIndex])
    },
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
                    const index = this.playerRecords
                      .findIndex((p: PlayerRecord) => p.name.toLowerCase() === playerName.toLowerCase())
                    const record = this.playerRecords[index]
                    if (record) {
                      record.registered = true
                      Vue.set(this.playerRecords, index, record)
                    } else {
                      // fabricate player records, as we don't have the information from SportLomo to do them properly
                      const pseudoPlayerRecord: PlayerRecord = new PlayerRecord(-1,row[0],'none','none')
                      if (row[0] !== 'Last Name, Member First Name') {
                        this.sportlomoNotRevolutionise.push(pseudoPlayerRecord)
                      }
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
      // setTimeout(() => { this.showFileLoadBox = false }, 15)
      this.showFileLoadBox = false
      
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
td, th {
  @apply px-2;
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
.row-summary {
  @apply flex flex-row;
}
.row {
  @apply flex flex-col;
}
.capitalize {
  text-transform: capitalize;
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
