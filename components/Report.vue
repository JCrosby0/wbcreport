<template>
  <div class="report">
    <!-- report start -->
    <h2>{{ report.label }}</h2>
    <ul>
      <li
        v-for="(line, j) in report.dataArray"
        :key="'membership-' + report.headingArray[j].label"
      >
        <!-- row start -->
        <div class="col">
          <div class="row-summary cursor-pointer" @click="toggleRow(i, j)">
            <div :class="{ 'print-hide': true, open: showRows[i][j] }">
              <span class="pr-2">{{
                showRows[i][j] ? "&#8964;" : "&#8250;"
              }}</span>
            </div>
            <div class="label">
              <span>{{ report.headingArray[j].label }}</span>
            </div>
            <div v-if="report.label === 'Amount Outstanding'" class="value">
              {{ numberFormat.format(line.balanceOutstanding) }}
            </div>
            <div v-else class="value">
              {{ line.length }}
              <!-- {{ line }} -->
            </div>
            <div class="tooltip print-hide">
              <span>ℹ️</span>
              <div class="tooltiptext">
                {{ report.headingArray[j].tooltip }}
              </div>
            </div>
          </div>
          <div v-if="showRows[i][j]" class="row-detail bg-gray-100 page-break">
            <table>
              <tr>
                <th
                  v-for="column in report.columns"
                  :key="'report' + i + column"
                >
                  {{ colHeadings[column] }}
                </th>
                <!-- <th>Payment Class</th>
                <th>Balance Outstanding</th> -->
                <!-- <th>Groups</th> -->
              </tr>
              <tr
                v-for="(player, k) in line.dataArray"
                :key="'player' + i + j + k"
              >
                <td
                  v-for="(cell, l) in extractData(player, report.columns)"
                  :key="'cell' + i + j + k + l"
                >
                  <span :class="{ 'table-cell': true, 'text-sm': l == 1 }">
                    {{ cell }}
                  </span>
                </td>
              </tr>
            </table>
            <div class="detail-row"></div>
          </div>
        </div>
        <!-- row end -->
      </li>
    </ul>
    <!-- report end -->
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { PlayerRecord } from "@/components/playerRecord";
import { Reports } from "@/components/reports";

const colHeadings = {
  name: "Player",
  paymentClass: "Payment Class",
  balanceBaseball: "Outstanding",
  balanceSoftball: "Outstanding",
  amountPaidBaseball: "Paid",
  amountPaidSoftball: "Paid",
  groups: "Teams",
  registered: "Sportlomo Activated",
};

export default Vue.extend({
  props: {
    report: {
      required: true,
      type: Reports,
    },
    i: {
      required: true,
      type: Number,
    },
  },
  data() {
    return {
      numberFormat: Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      colHeadings: colHeadings,
      showRows: [
        Array(6).fill(false),
        Array(6).fill(false),
        Array(3).fill(false),
        Array(2).fill(false),
        Array(13).fill(false),
      ] as boolean[][],
    };
  },
  methods: {
    //extract Data from a PlayerRecord and format it for display
    extractData(
      rec: PlayerRecord,
      columns: Array<keyof PlayerRecord>
    ): string[] {
      return columns.map((c: keyof PlayerRecord) => {
        // if request is for 'balance' take the sum of both, since they are only being separated to account for players that might be in both systems.
        if (["balanceBaseball", "balanceSoftball"].includes(c)) {
          return `${
            +rec["balanceBaseball"] + +rec["balanceSoftball"]
          }` as string;
        }

        if (["amountPaidBaseball", "amountPaidSoftball"].includes(c)) {
          return `${
            +rec["amountPaidBaseball"] + +rec["amountPaidSoftball"]
          }` as string;
        }

        if (c === "registered") return `${!!rec[c]}` as string;
        return rec[c] as string;
      });
    },
    toggleRow(reportIndex: number, lineItemIndex: number): void {
      this.$set(
        this.showRows[reportIndex],
        lineItemIndex,
        !this.showRows[reportIndex][lineItemIndex]
      );
    },
  },
});
</script>

<style scoped></style>
