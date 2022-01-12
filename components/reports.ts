import { Headings } from '@/components/headings'
import { PlayerRecord } from '@/components/playerRecord'
/**
 * Reports are the display items on the report page.
 * They get iterated to display content as necessary
 */
export class Reports {
    label: string
    dataArray: ReportLineItem[]
    headingArray: Headings[]
    constructor(
        label: string,
        dataArray: ReportLineItem[],
        headingArray: Headings[]
    ) {
        this.label = label
        this.dataArray = dataArray
        this.headingArray = headingArray
    }
}

/**
 * ReportLineItem
 * Be able to display the length for the summary, and the whole
 * array in order to expand the results.
 * The reports.dataArray be of type ReportLineItem[]
 */
export class ReportLineItem {
    dataArray: PlayerRecord[]
    length: number
    balanceOutstanding: number | undefined
    showContent: boolean
    constructor (
        dataArray: PlayerRecord[],
        balanceType?: string,
        showContent = false as boolean
    ){
        this.dataArray = dataArray
        this.length = this.dataArray.length
        this.showContent = showContent
        if (balanceType && ['baseball', 'softball', 'teeball', 'tee-ball'].includes(balanceType)) {
            this.balanceOutstanding = this.dataArray
            .reduce((a: number, c: PlayerRecord) => {
                return a + +c[(balanceType === 'baseball' ? 'balanceBaseball' : 'balanceSoftball')]
            }, 0)
        } else {
            this.balanceOutstanding = undefined
        }

    }
}
