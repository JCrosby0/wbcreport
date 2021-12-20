export class Reports {
    label: string
    dataArray: string
    headingArray: string
    constructor(
        label: string,
        dataArray: string,
        headingArray: string
    ) {
        this.label = label
        this.dataArray = dataArray
        this.headingArray = headingArray
    }
}
