<template>
  <div class="container mx-auto">
    <h1>WBC Registrar Report</h1>
    <div class="files flex flex-col">
      <FileLoad
        v-show="showFileLoadBox"
        :datasources="datasources"
        :haveData="haveData"
      />
      <div>
        <input
          class="print-hide"
          type="file"
          autofocus
          multiple
          accept=".csv"
          @change="(ev) => handleFileChange(ev)"
          defaultValue="Choose File(s)"
        />
      </div>
      <span v-if="dates.length"> Files downloaded: {{ formattedDates }} </span>
    </div>
    <!-- values report for screen display and print -->
    <div v-if="playerRecords.length > 0" class="results">
      <button class="border-2 px-2 py-1" @click="uploadReport">
        {{ uploadBtnText }}
      </button>
      <a
        href="https://docs.google.com/spreadsheets/d/1-Dv7yxqmUi9XSfHylF0IChUyRIMiGUEcwjY2NqN20h4/edit#gid=0"
        target="_blank"
        >Open Report in Google Sheets</a
      >
      <Report
        v-for="(report, i) in reports"
        :key="report.label"
        class="report"
        :report="report"
        :i="i"
      />
    </div>
    <!-- Explanation of filtering for print report -->
    <Summary
      class="screen-hide page-break text-sm"
      :haveData="haveData"
      :reports="reports"
    />
    <!-- TODO: set up numbers to toggle table display of data -->
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import getData from "@/components/getData";
import { parseRow, summariseRecords } from "@/components/functions";
import { teamGroupList } from "@/components/teamlist";
import { PlayerRecord } from "@/components/playerRecord";
import { Reports, ReportLineItem } from "@/components/reports";
import { DataSource, datasources } from "@/components/dataSources";
import { OverviewRow } from "@/components/reportOverview";
import Report from "@/components/Report.vue";
import FileLoad from "@/components/FileLoad.vue";
import Summary from "@/components/Summary.vue";
import {
  Headings,
  headingsSports,
  headingsFees,
  headingsOutstanding,
  headingsRegistration,
  headingsByTeam,
} from "@/components/headings";

interface RecordsBySport {
  baseball: PlayerRecord[];
  softball: PlayerRecord[];
  teeball: PlayerRecord[];
}
interface SummaryBySport {
  baseball: number[];
  softball: number[];
  teeball: number[];
}
const sports = ["baseball", "softball", "teeball"] as Array<
  keyof SummaryBySport
>;

export default Vue.extend({
  name: "ReportPage",
  components: {
    Report,
    FileLoad,
    Summary,
  },
  data() {
    return {
      uploadingStatus: false,
      uploadBtnText: "Upload Report to Excel",
      teamGroupList: teamGroupList as string[],
      dates: [] as Date[],
      datasources: [...datasources] as DataSource[],
      showFileLoadBox: true,

      playerRecords: [] as PlayerRecord[],
      records: {
        baseball: [],
        softball: [],
        teeball: [],
      } as RecordsBySport,
      summary: {
        baseball: [],
        softball: [],
        teeball: [],
      } as SummaryBySport,
      sportlomoNotRevolutionise: [] as PlayerRecord[],
      transactionsNotPlayerRecord: [] as string[][],
      reports: [] as Reports[],
    };
  },
  async mounted() {
    const data = getData();
    console.log(data);
  },
  computed: {
    haveData(): boolean {
      return (
        this.playerRecords &&
        (this.records?.baseball.length === 0 ||
          this.records?.softball.length === 0)
      );
    },

    // DATES
    formattedDates(): string {
      if (this.dates[0].getDate() === this.dates[1].getDate()) {
        return `${this.dates[1].getDate()}/${
          this.dates[1].getMonth() + 1
        }/${this.dates[1].getFullYear()}`;
      }
      return `${this.dates[0].getDate()}/${
        this.dates[0].getMonth() + 1
      } - ${this.dates[1].getDate()}/${
        this.dates[1].getMonth() + 1
      }/${this.dates[1].getFullYear()}`;
    },
  },
  methods: {
    /**
     * Called at the end of file parsing in the handleFileChange event. It follows:
      - parsePlayerRecords;
      - parseTransactions();
      - parseBaseballRegistration();
      Which means the following should be available
      - this.playerRecords
      - this.sportlomoNotRevolutionise
     */
    prepareDataForReport(): void {
      // sort the records one time
      if (!this.playerRecords.length) console.warn("No data found...");

      // generate filtered lists by sport
      const fByFees = (p: PlayerRecord, sport: string): boolean => {
        return (
          p[sport === "softball" ? "balanceSoftball" : "balanceBaseball"] > 0
        );
      };

      const filterPRBySport = (
        sport: string,
        pr = [] as PlayerRecord[]
      ): PlayerRecord[] => {
        // handle teeball case
        if (sport === "teeball") sport = "tee-ball";

        // sort function by payment class then by name
        const sByPaymentClass = (a: PlayerRecord, b: PlayerRecord): number => {
          if (a.paymentClass === b.paymentClass) {
            return a.name > b.name ? 1 : -1;
          }
          return a.paymentClass > b.paymentClass ? 1 : -1;
        };
        // cannot put this.playerRecords in the arguments due to type restriction
        if (!pr.length) {
          pr = this.playerRecords;
        }
        // filter by sport and sort
        return pr
          .filter((p) =>
            p.sports
              .map((s: string) => s.toLowerCase())
              .includes(sport.toLowerCase())
          )
          .sort(sByPaymentClass);
      };
      // assign this.records and this.summary for each sport
      sports.forEach((sport) => {
        const records = filterPRBySport(sport);
        Vue.set(this.records, sport, records);
        this.summary[sport] = records.reduce(
          (acc, cur) => summariseRecords(acc, cur, sport),
          Array(7).fill(0)
        );
      });
      // MEMBERS
      const membersArray = [
        // baseball members
        this.records.baseball,
        // softball members
        this.records.softball,
        // teeball members
        this.records.teeball,
        // teeball u6
        this.records.teeball.filter((p: PlayerRecord) =>
          p.paymentClass.match(/Teeball under 6/)
        ),
        // teeballers playing baseball
        this.records.baseball.filter((p: PlayerRecord) =>
          this.records.teeball.includes(p)
        ),
        // total members
        this.playerRecords,
      ];
      const members = membersArray.map((item) => new ReportLineItem(item));

      // FEES
      const feesArray = sports.map((sport): PlayerRecord[] => {
        return this.records[sport].filter((p) => fByFees(p, sport));
      });

      const fees = feesArray.map((item) => new ReportLineItem(item));
      const outstanding = feesArray.map(
        (item, i) =>
          new ReportLineItem(item, ["baseball", "softball", "baseball"][i])
      );

      // REGISTRATION
      const registrationBaseball = this.records.baseball.filter(
        (r: PlayerRecord) => r.registered !== true
      );
      const registration = [
        new ReportLineItem(registrationBaseball),
        new ReportLineItem(this.sportlomoNotRevolutionise),
      ];

      // generate a report by team
      const byTeam = teamGroupList.map((teamName: string) => {
        return new ReportLineItem(
          this.records.baseball
            .filter(
              (r: PlayerRecord) =>
                r.groups
                  .split(",")
                  .map((group) => group.trim())
                  .includes(teamName) &&
                (r.balanceBaseball > 0 || !r.registered)
            )
            .sort((a: PlayerRecord, b: PlayerRecord) =>
              a.paymentClass > b.paymentClass ? 1 : -1
            )
        );
      });

      // finally, generate the data to be iterated to create the reports
      this.reports = [
        new Reports("Membership Numbers", members, headingsSports),
        new Reports("Members with Outstanding Fees", fees, headingsFees),
        new Reports("Amount Outstanding", outstanding, headingsOutstanding, [
          "name",
          "paymentClass",
          "amountPaidBaseball",
          "balanceBaseball",
        ]),
        new Reports(
          "Members with Outstanding Registration",
          registration,
          headingsRegistration,
          ["name", "paymentClass", "registered"]
        ),
        new Reports("Outstanding Baseballers by Team", byTeam, headingsByTeam, [
          "name",
          "paymentClass",
          "balanceBaseball",
          "registered",
        ]),
      ];
    },

    // GROUPS
    // Start with generating a list of groups for manual processing.
    // In future look at a standardised way of splitting out 'team' groups from 'league' or 'coach' groups
    listOfGroups(): string[] {
      return this.records.baseball
        .reduce((acc: string[], cur: PlayerRecord) => {
          cur.groups.split(",").forEach((group: string) => {
            const groupName = group.trim();
            if (!!groupName && !acc.includes(groupName)) {
              acc.push(groupName);
            }
          });
          return acc;
        }, [])
        .sort((a, b) => (a > b ? 1 : -1));
    },
    /**
     * function to call serverless function to upload data to google sheets
     * prepare data client side to minimise server load in favor of reducing uploads
     */
    async uploadReport() {
      console.log("Creating new report...");
      if (this.uploadingStatus) {
        console.warn("Upload in progress, wait until complete");
        return;
      }
      this.uploadingStatus = true;
      this.uploadBtnText = "Uploading... Please wait.";

      // refer https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

      const clubSummary = this.playerRecords.reduce(
        (acc, cur) => summariseRecords(acc, cur, "all"),
        Array(7).fill(0)
      );

      const overview = [
        new OverviewRow("Baseball", this.summary.baseball),
        new OverviewRow("Softball", this.summary.softball),
        new OverviewRow("Tee-ball", this.summary.teeball),
        new OverviewRow("Club", clubSummary),
      ];

      const payload = {
        playerRecords: this.playerRecords,
        sportRecords: this.records,
        overview: overview,
      };

      const newReport = await fetch("/.netlify/functions/createNewReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .catch((err) => console.error("Someting went wrong", err));
      console.log("New Report Created: ", newReport);
      this.uploadBtnText = "Upload Complete";
      this.uploadingStatus = false;
      return;
    },
    async handleFileChange(event: Event, f: number = 0) {
      const target = event.target as HTMLInputElement;
      const files = target.files as FileList;
      // get the dates from the files to provide a summary of when the data was last updated
      this.dates = Array.from(files)
        .reduce(
          (a, c) =>
            (a = [
              Math.min(a[0], c.lastModified),
              Math.max(a[1], c.lastModified),
            ]),
          [9999999999999, 0]
        )
        .map((d) => new Date(d));
      /**
       * Function to read csv, parse into rectangular array, and select desired columns and handle end rows
       */
      const readFile = async (
        ev: Event,
        reader: FileReader,
        fileIndex: number
      ) => {
        let theCSV = reader.result as string;
        let theRows = theCSV.split(/\r?\n|\r/);
        let theCols = theRows.map((c) => parseRow(c));
        // if last row is different length. fix parsing or omit
        let len = theCols.length;
        if (theCols[0].length !== theCols[len - 1].length) {
          theCols = theCols.slice(0, len - 1);
        }
        // specific handling for sportlomo file - select relevant columns
        if (fileIndex === 2) {
          theCols = theCols.map((row) => {
            return [row[4] + ", " + row[3], row[7]];
          });
        }
        return theCols;
      };

      /**
       * Specific parsing for player records
       */
      const parsePlayerRecords = async () => {
        let promises = [] as Promise<void>[];
        for (let i = 0; i < files!.length; i++) {
          const file = files![i];
          let fileIndex: number;
          // Select only the relevant files
          if (file.name.match(/ClubWildcats.*Member/)) {
            fileIndex = 1;
          } // softball membership
          else if (file.name.match(/Club.*Member/)) {
            fileIndex = 0;
          } // baseball membership
          else continue; // this routine doesn't handle the other three files
          promises.push(
            new Promise((resolve, reject): void => {
              const reader = new FileReader();
              // assign function to the onload event
              reader.onload = async (ev: Event) => {
                readFile(ev, reader, fileIndex)
                  // specific handling for player records
                  .then((theCols) => {
                    theCols.forEach((row, i) => {
                      if (row[0] === "Name") return; // ignore header row
                      this.playerRecords.push(
                        new PlayerRecord(fileIndex, row[0], row[1], row[2])
                      );
                    });
                    resolve();
                  })
                  .catch((err) => reject(err));
              };
              // read the file, triggering the onload event
              reader.readAsText(file);
            })
          );
        }
        return promises;
      };
      /**
       * Specific parsing for transaction data
       */
      const parseTransactions = async () => {
        let promises = [] as Promise<void>[];
        for (let i = 0; i < files!.length; i++) {
          const file = files![i];
          let fileIndex: number;
          if (file.name.match(/ClubWildcats.*Transactions/)) {
            fileIndex = 4;
          } else if (file.name.match(/Club.*Transactions/)) {
            fileIndex = 3;
          } else continue; // this routine doesn't handle the other three files

          promises.push(
            new Promise((resolve, reject): void => {
              const reader = new FileReader();
              // assign function to the onload event
              reader.onload = async (ev: Event) => {
                readFile(ev, reader, fileIndex)
                  // specific handling for player records
                  .then((theCols) => {
                    theCols.forEach((row, i) => {
                      if (["Member", "Total"].includes(row[0])) {
                        return;
                      } // ignore header & footer rows
                      const playerName = row[0];
                      const index = this.playerRecords.findIndex(
                        (p: PlayerRecord) =>
                          p.name.toLowerCase() === playerName.toLowerCase()
                      );
                      const record = this.playerRecords[index];
                      if (record) {
                        if (fileIndex === 3) {
                          record.amountOwedBaseball = +row[1];
                          record.amountPaidBaseball = +row[2];
                          record.balanceBaseball = +row[3];
                        }
                        if (fileIndex === 4) {
                          record.amountOwedSoftball = +row[1];
                          record.amountPaidSoftball = +row[2];
                          record.balanceSoftball = +row[3];
                        }

                        Vue.set(this.playerRecords, index, record);
                      } else {
                        if (+row[1] > 0) {
                          this.transactionsNotPlayerRecord.push(row);
                        }
                      }
                    });
                    resolve();
                  })
                  .catch((err) => reject(err));
              };
              reader.readAsText(file);
            })
          );
        }
        return promises;
      };
      /**
       * Specific parsing for Sportlomo data
       */
      const parseBaseballRegistration = async () => {
        let promises = [] as Promise<void>[];
        for (let i = 0; i < files!.length; i++) {
          const file = files![i];
          let fileIndex = NaN as number;
          // enable multiple file select/upload, and index them correctly
          if (file.name.match(/member/)) {
            fileIndex = 2;
          } // sportlomo file
          else continue;
          promises.push(
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              // assign function to the onload event
              reader.onload = async (ev: Event) => {
                readFile(ev, reader, fileIndex)
                  // specific handling for player records
                  .then((theCols) => {
                    theCols.forEach((row) => {
                      const playerName = row[0];
                      const index = this.playerRecords.findIndex(
                        (p: PlayerRecord) =>
                          p.name.toLowerCase() === playerName.toLowerCase()
                      );
                      const record = this.playerRecords[index];
                      if (record) {
                        record.registered = true;
                        Vue.set(this.playerRecords, index, record);
                      } else {
                        // fabricate player records, as we don't have the information from SportLomo to do them properly
                        const pseudoPlayerRecord: PlayerRecord =
                          new PlayerRecord(-1, row[0], "none", "none");
                        if (row[0] !== "Last Name, Member First Name") {
                          this.sportlomoNotRevolutionise.push(
                            pseudoPlayerRecord
                          );
                        }
                      }
                    });
                    resolve();
                  })
                  .catch((err) => reject(err));
              };
              // read the file, triggering the onload event
              reader.readAsText(file);
            })
          );
        }
        return promises;
      };

      // Launch parse functions to filter appropriate files and attach onLoad parsing functions.
      // return promises before preparing data for report
      const records = await parsePlayerRecords();
      const transactions = await parseTransactions();
      const registration = await parseBaseballRegistration();
      Promise.all([...records, ...transactions, ...registration]).then(() => {
        this.prepareDataForReport();
        this.showFileLoadBox = false;
      });
    },
  },
});
</script>

<style>
h1 {
  @apply text-3xl pt-3;
}
h2 {
  @apply text-2xl pt-2;
}
h3 {
  @apply text-xl pt-1;
}
td,
th {
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
.col {
  @apply flex flex-col;
}
.row {
  @apply flex flex-row;
}
.table-cell {
  text-transform: capitalize;
  white-space: nowrap;
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
