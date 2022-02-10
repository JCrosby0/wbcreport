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
      <span v-if="this.dates.length">
        Files downloaded: {{ formattedDates }}
      </span>
    </div>
    <!-- values report for screen display and print -->
    <div v-if="playerRecords.length > 0" class="results">
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
import { PlayerRecord } from "@/components/playerRecord";
import { Reports, ReportLineItem } from "@/components/reports";
import { DataSource, datasources } from "@/components/dataSources";
import Report from "@/components/Report.vue";
import FileLoad from "@/components/FileLoad.vue";
import Summary from "@/components/Summary.vue";
import {
  Headings,
  headingsSports,
  headingsFees,
  headingsOutstanding,
  headingsRegistration,
} from "@/components/headings";

// https://stackoverflow.com/questions/54860670/how-to-split-a-string-containing-csv-data-with-arbitrary-text-into-a-javascript
let parseRow = function (row: string) {
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

const teamGroupList: string[] = [
  // "Baseball Big League",
  "Baseball IL - Green",
  // "Baseball IL - Green (Coach)",
  "Baseball IL - White",
  // "Baseball Intermediate League",
  "Baseball JL - Green",
  "Baseball JL - White",
  // "Baseball Junior League",
  "Baseball LL - Black",
  "Baseball LL - Green",
  // "Baseball LL - Green (Coach)",
  "Baseball LL - White",
  // "Baseball LL - White (Coach)",
  "Baseball LL - Yellow",
  // "Baseball Little League",
  // "Baseball Little League (Coach)",
  "Baseball Machine Pitch",
  // "Baseball Machine Pitch (Coach)",
  "Baseball Senior (Adult) Baseball",
  "Baseball Senior League",
  "Baseball Women's Baseball",
  "Teeball Tee-Ball 6 to 12",
];

export default Vue.extend({
  name: "ReportPage",
  components: {
    Report,
    FileLoad,
    Summary,
  },
  data() {
    const headingsByTeam = teamGroupList.map((teamName: string) => {
      return new Headings(
        teamName.slice(0, 8) === "Baseball" ? teamName.slice(9) : teamName,
        `Players with outstanding membership on ${teamName}`
      );
    });
    return {
      teamGroupList: teamGroupList as string[],
      dates: [] as Date[],
      datasources: [...datasources] as DataSource[],
      showFileLoadBox: true,
      sportlomoNotRevolutionise: [] as PlayerRecord[],
      transactionsNotPlayerRecord: [] as string[][],
      playerRecords: [] as PlayerRecord[],
      headingsSports: headingsSports as Headings[],
      headingsFees: headingsFees as Headings[],
      headingsOutstanding: headingsOutstanding as Headings[],
      headingsRegistration: headingsRegistration as Headings[],
      headingsByTeam: headingsByTeam as Headings[],
    };
  },
  computed: {
    haveData(): boolean {
      return (
        this.playerRecords &&
        (this.recordsBaseball.length === 0 || this.recordsSoftball.length === 0)
      );
    },
    // GROUPS
    // Start with generating a list of groups for manual processing.
    // In future look at a standardised way of splitting out 'team' groups from 'league' or 'coach' groups
    listOfGroups(): string[] {
      return this.recordsBaseball
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

    // PLAYER RECORDS
    recordsBaseball(): PlayerRecord[] {
      return (
        this.playerRecords
          .filter((p: PlayerRecord) => p.sports.includes("Baseball"))
          .sort((a, b) => (a.name > b.name ? 1 : -1)) || []
      );
    },
    recordsSoftball(): PlayerRecord[] {
      return (
        this.playerRecords.filter((p: PlayerRecord) =>
          p.sports.includes("Softball")
        ) || []
      );
    },
    recordsTeeball(): PlayerRecord[] {
      return (
        this.playerRecords.filter((p: PlayerRecord) =>
          p.sports.includes("Tee-ball")
        ) || []
      );
    },

    // MEMBERS
    membersBaseball(): PlayerRecord[] {
      return this.recordsBaseball.sort((a: PlayerRecord, b: PlayerRecord) => {
        if (a.paymentClass === b.paymentClass) {
          return a.name > b.name ? 1 : -1;
        }
        return a.paymentClass > b.paymentClass ? 1 : -1;
      });
    },
    membersSoftball(): PlayerRecord[] {
      return this.recordsSoftball;
    },
    membersTeeball(): PlayerRecord[] {
      return this.recordsTeeball;
    },
    membersTeeballU6(): PlayerRecord[] {
      return this.recordsTeeball.filter((p: PlayerRecord) => {
        return p.paymentClass.match(/Teeball under 6/);
      });
    },
    membersTeeballBaseball(): PlayerRecord[] {
      return this.recordsBaseball.filter((p) =>
        this.recordsTeeball.includes(p)
      );
    },
    membersTotal(): PlayerRecord[] {
      return this.playerRecords;
    },
    members(): ReportLineItem[] {
      return [
        new ReportLineItem(this.membersBaseball),
        new ReportLineItem(this.membersSoftball),
        new ReportLineItem(this.membersTeeball),
        new ReportLineItem(this.membersTeeballU6),
        new ReportLineItem(this.membersTeeballBaseball),
        new ReportLineItem(this.membersTotal),
      ];
    },

    // FEES
    feesBaseball(): PlayerRecord[] {
      return this.recordsBaseball
        .filter((f: PlayerRecord) => f.balanceBaseball > 0)
        .sort((a: PlayerRecord, b: PlayerRecord) =>
          a.paymentClass > b.paymentClass
            ? 1
            : a.paymentClass < b.paymentClass
            ? -1
            : a.name > b.name
            ? 1
            : -1
        );
    },
    feesSoftball(): PlayerRecord[] {
      return this.recordsSoftball.filter(
        (f: PlayerRecord) => f.balanceSoftball > 0
      );
    },
    feesTeeball(): PlayerRecord[] {
      return this.recordsTeeball.filter(
        (f: PlayerRecord) => f.balanceBaseball > 0
      );
    },
    feesBaseballInvoiced(): PlayerRecord[] {
      return this.recordsBaseball.filter((p: PlayerRecord) => {
        return (
          p.paymentClass.match(/Invoiced.*(?:Baseball|League).*/) &&
          p.balanceBaseball > 0
        );
      });
    },
    feesBaseballPart(): PlayerRecord[] {
      return this.recordsBaseball.filter((p: PlayerRecord) => {
        return (
          p.paymentClass.match(/Part Paid.*(?:Baseball|League).*/) &&
          p.balanceBaseball > 0
        );
      });
    },
    feesBaseballSenior(): PlayerRecord[] {
      return this.recordsBaseball.filter((p: PlayerRecord) => {
        return (
          p.paymentClass.match(/(?:Invoiced|Part Paid).*Baseball.*/) &&
          p.balanceBaseball > 0
        );
      });
    },
    fees(): ReportLineItem[] {
      return [
        new ReportLineItem(this.feesBaseball),
        new ReportLineItem(this.feesSoftball),
        new ReportLineItem(this.feesTeeball),
        new ReportLineItem(this.feesBaseballInvoiced),
        new ReportLineItem(this.feesBaseballPart),
        new ReportLineItem(this.feesBaseballSenior),
      ];
    },

    // AMOUNT OUTSTANDING
    amountOutstandingBaseball(): PlayerRecord[] {
      return this.recordsBaseball
        .filter((f: PlayerRecord) => f.balanceBaseball > 0)
        .sort((a: PlayerRecord, b: PlayerRecord) =>
          a.paymentClass > b.paymentClass ? 1 : -1
        );
    },
    amountOutstandingSoftball(): PlayerRecord[] {
      return this.recordsSoftball.filter(
        (f: PlayerRecord) => f.balanceSoftball > 0
      );
    },
    amountOutstandingTeeball(): PlayerRecord[] {
      return this.recordsTeeball.filter(
        (f: PlayerRecord) => f.balanceBaseball > 0
      );
    },
    outstanding(): ReportLineItem[] {
      return [
        new ReportLineItem(this.amountOutstandingBaseball, "baseball"),
        new ReportLineItem(this.amountOutstandingSoftball, "softball"),
        new ReportLineItem(this.amountOutstandingTeeball, "baseball"),
      ];
    },

    // REGISTRATION
    registrationBaseball(): PlayerRecord[] {
      return this.recordsBaseball
        .filter((r: PlayerRecord) => r.registered !== true)
        .sort((a: PlayerRecord, b: PlayerRecord) =>
          a.paymentClass > b.paymentClass ? 1 : -1
        );
    },
    registration(): ReportLineItem[] {
      return [
        new ReportLineItem(this.registrationBaseball),
        new ReportLineItem(this.sportlomoNotRevolutionise),
      ];
    },
    // generate a report by team
    byTeam(): ReportLineItem[] {
      return teamGroupList.map((teamName: string) => {
        return new ReportLineItem(
          this.recordsBaseball
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
    },

    reports(): Reports[] {
      return [
        // new Reports('Player Records', this.records, this.headingsSports),
        new Reports("Membership Numbers", this.members, this.headingsSports),
        new Reports(
          "Members with Outstanding Fees",
          this.fees,
          this.headingsFees
        ),
        new Reports(
          "Amount Outstanding",
          this.outstanding,
          this.headingsOutstanding,
          ["name", "paymentClass", "amountPaidBaseball", "balanceBaseball"]
        ),
        new Reports(
          "Members with Outstanding Registration",
          this.registration,
          this.headingsRegistration,
          ["name", "paymentClass", "registered"]
        ),
        new Reports(
          "Outstanding Baseballers by Team",
          this.byTeam,
          this.headingsByTeam,
          ["name", "paymentClass", "balanceBaseball", "registered"]
        ),
      ];
    },
  },
  methods: {
    async handleFileChange(event: Event, f: number = 0) {
      const target = event.target as HTMLInputElement;
      const files = target.files as FileList;
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

      const parsePlayerRecords = async () => {
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

          const reader = new FileReader();
          // assign function to the onload event
          reader.onload = (ev: Event) => {
            readFile(ev, reader, fileIndex)
              // specific handling for player records
              .then((theCols) => {
                theCols.forEach((row, i) => {
                  if (row[0] === "Name") return; // ignore header row
                  this.playerRecords.push(
                    new PlayerRecord(fileIndex, row[0], row[1], row[2])
                  );
                });
              });
          };
          // read the file, triggering the onload event
          await reader.readAsText(file);
        }
        return;
      };

      const parseTransactions = async () => {
        for (let i = 0; i < files!.length; i++) {
          const file = files![i];
          let fileIndex: number;
          if (file.name.match(/ClubWildcats.*Transactions/)) {
            fileIndex = 4;
          } else if (file.name.match(/Club.*Transactions/)) {
            fileIndex = 3;
          } else continue; // this routine doesn't handle the other three files

          const reader = new FileReader();
          // assign function to the onload event
          reader.onload = (ev: Event) => {
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
              });
          };
          reader.readAsText(file);
        }
        return;
      };

      const parseBaseballRegistration = async () => {
        for (let i = 0; i < files!.length; i++) {
          const file = files![i];
          let fileIndex = NaN as number;
          // enable multiple file select/upload, and index them correctly
          if (file.name.match(/member/)) {
            fileIndex = 2;
          } // sportlomo file
          else continue;

          const reader = new FileReader();
          // assign function to the onload event
          reader.onload = (ev: Event) => {
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
                    const pseudoPlayerRecord: PlayerRecord = new PlayerRecord(
                      -1,
                      row[0],
                      "none",
                      "none"
                    );
                    if (row[0] !== "Last Name, Member First Name") {
                      this.sportlomoNotRevolutionise.push(pseudoPlayerRecord);
                    }
                  }
                });
              });
          };
          // read the file, triggering the onload event
          reader.readAsText(file);
        }
        return;
      };

      // playerRecords have to be completed before the others can be executed
      const records = await parsePlayerRecords();
      const transactions = parseTransactions();
      const registration = parseBaseballRegistration();
      // setTimeout(() => { this.showFileLoadBox = false }, 15)
      this.showFileLoadBox = false;
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
