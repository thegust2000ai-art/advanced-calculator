declare module 'function-plot' {
  export interface FunctionPlotOptions {
    target: string | HTMLElement;
    width?: number;
    height?: number;
    grid?: boolean;
    xAxis?: { domain?: [number, number] };
    yAxis?: { domain?: [number, number] };
    annotations?: Array<{ x: number; text?: string }>;
    data: Array<{
      fn?: string;
      fnType?: string;
      graphType?: string;
      range?: [number, number];
      color?: string;
      shift?: number;
      closed?: boolean;
    }>;
  }
  export default function functionPlot(options: FunctionPlotOptions): void;
}
