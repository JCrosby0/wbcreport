export { default as FileLoad } from '../../components/FileLoad.vue'
export { default as Report } from '../../components/Report.vue'
export { default as Summary } from '../../components/Summary.vue'
export { default as DataSources } from '../../components/dataSources.ts'
export { default as Headings } from '../../components/headings.ts'
export { default as PlayerRecord } from '../../components/playerRecord.ts'
export { default as ReportOverview } from '../../components/reportOverview.ts'
export { default as Reports } from '../../components/reports.ts'

// nuxt/nuxt.js#8607
function wrapFunctional(options) {
  if (!options || !options.functional) {
    return options
  }

  const propKeys = Array.isArray(options.props) ? options.props : Object.keys(options.props || {})

  return {
    render(h) {
      const attrs = {}
      const props = {}

      for (const key in this.$attrs) {
        if (propKeys.includes(key)) {
          props[key] = this.$attrs[key]
        } else {
          attrs[key] = this.$attrs[key]
        }
      }

      return h(options, {
        on: this.$listeners,
        attrs,
        props,
        scopedSlots: this.$scopedSlots,
      }, this.$slots.default)
    }
  }
}
