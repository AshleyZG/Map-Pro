import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';


export interface PlotData {
    code: string;
    x: number;
    y: number;
    cluster: number;
    segLabels: string[];
    segments: string[];
}

interface PlotDiagramProps {
    data: PlotData[];
    updateSelectionFn: (codeSelection: string[]) => void;
}

export const PlotDiagram: React.FC<PlotDiagramProps> = ({data, updateSelectionFn}) => {

    const width = 800;
    const height = 600;
    const marginL = 20;
    const marginR = 20;
    const marginT = 20;
    const marginB = 20;

    const svgRef = useRef<SVGSVGElement>(null);

    const updateBrush = ( event: any) => {
        function isBrushed(extent: any, cx: string, cy: string): boolean{
            var x0 = extent[0][0],
                x1 = extent[1][0],
                y0 = extent[0][1],
                y1 = extent[1][1];
            var x = parseFloat(cx);
            var y = parseFloat(cy);
            return  x>=x0 && x<=x1 && y>=y0 && y<=y1;
        }
        const graph: d3.Selection<any, unknown, HTMLElement, any> = d3.select('#scatterPlot') 

        var extent = d3.brushSelection((graph.select('.brush') as any).node());

        var allDots = graph.selectAll('.dot');
        
        if (extent && allDots){
            allDots.classed("selected", function(d) {return isBrushed(extent!, d3.select(this).attr('cx'), d3.select(this).attr('cy')) && d3.select((this as any).parentNode).attr('visibility')!=='hidden'});

            updateSelectionFn(graph.selectAll('.dot.selected').data().map((v, i) => (v as any).code))
        }
    }

    useEffect(() => {
        if (!svgRef.current) return;
    
        // an initial data
        var inputdata: PlotData[] = [];
        // once passed data from the backend, update the data
        if (data.length > 0) {
            inputdata = data;
        }
  
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear svg content before adding new elements  

        const xScale = d3.scaleLinear()
            .domain([ d3.min(inputdata, d => d.x)!, d3.max(inputdata, d => d.x)!])
            .range([marginL, width-marginR]);


        const yScale = d3.scaleLinear()
            .domain([d3.min(inputdata, d => d.y)!, d3.max(inputdata, d => d.y)!])
            .range([marginB, height-marginT]);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const graph = svg.append('g').attr('id', 'scatterPlot')
            
        graph.selectAll('.dot')
            .data(inputdata)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 5)
            .attr('class', 'dot')
            .on("click", (event, d) => {
                console.log(d.code);
            })
            .style('fill', (d) => color(d.cluster.toString()));

        // add brush to svg
        graph.append('g')
            .attr('class', 'brush')
            .call(d3.brush<any>()
            .extent([[0, 0], [width, height]])
            .on("start brush end", function(event){
                updateBrush(event);
            }), null
        )

    }, [data]);
  
    return <svg ref={svgRef} width={width} height={height} style={{ border: "1px solid black" }} />;
  
}