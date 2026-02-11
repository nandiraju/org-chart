declare module 'd3-org-chart' {
  export class OrgChart {
    constructor();
    container(selector: string | HTMLElement): this;
    data(data: any[]): this;
    nodeHeight(fn: (d: any) => number): this;
    nodeWidth(fn: (d: any) => number): this;
    childrenMargin(fn: (d: any) => number): this;
    compactMarginBetween(fn: (d: any) => number): this;
    compactMarginPair(fn: (d: any) => number): this;
    neighbourMargin(fn: (a: any, b: any) => number): this;
    onNodeClick(fn: (d: any) => void): this;
    nodeContent(fn: (d: any) => string): this;
    render(): this;
    getChartState(): any;
    duration(duration: number): this;
  }
}
