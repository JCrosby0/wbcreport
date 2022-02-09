<template>
  <div class="file-load-box">
    <h2>Data to be loaded:</h2>
    <p>
      Note: They all require log-in, and cannot log in to both baseball and
      softball revo accounts in the same browser simultaneously.
    </p>
    <div v-for="(ds, i) in datasources" :key="'file' + i" class="revBT">
      <div v-if="haveData" class="no-selected">
        <span>Load {{ ds.label }} Data</span> --
        <a :href="ds.link" target="_blank">Download Link</a><br />
      </div>
      <div v-else class="selected print-hide">{{ ds.label }} Data Loaded</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "FileLoadBox",
  props: {
    datasources: {
      required: true,
    },
    haveData: {
      required: true,
      default: () => false,
    },
  },
});
</script>

<style></style>
