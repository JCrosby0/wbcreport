<template>
  <div class="summary">
    <h2>Methodology:</h2>
    <span>Five reports are downloaded and parsed</span>
    <ul class="summary">
      <li>
        A members report showing payment class and groups from revolutionise for
        both Baseball/Tee-ball and Softball.
      </li>
      <li>
        A transaction report from revolutionise showing amount owed, amount paid
        and balance for both Baseball/Tee-ball and Softball
      </li>
      <li>
        A membership report from Sportlomo showing actively registered players
      </li>
    </ul>
    <div v-if="haveData" class="results">
      <div v-for="report in reports" :key="report.label" class="report">
        <h3>{{ report.label }}</h3>
        <ul>
          <li
            v-for="(_, j) in report.dataArray"
            :key="'membership-' + report.headingArray[j].label"
          >
            <div class="row">
              <div class="label">
                <span>{{ report.headingArray[j].label }}</span>
              </div>
              <div class="print-tooltip">
                <span>{{ report.headingArray[j].tooltip }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "Summary",
  props: {
    haveData: {
      required: true,
    },
    reports: {
      required: true,
    },
  },
});
</script>

<style></style>
