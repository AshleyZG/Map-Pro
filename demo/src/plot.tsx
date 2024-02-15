import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';


export interface PlotData {
    code: string;
    x: number;
    y: number;
    cluster: number;
}

interface PlotDiagramData {
    data: PlotData[];
}

export const PlotDiagram: React.FC<PlotDiagramData> = ({data}) => {

    const width = 800;
    const height = 600;
    const marginL = 20;
    const marginR = 20;
    const marginT = 20;
    const marginB = 20;

    const svgRef = useRef<SVGSVGElement>(null);

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

    svg.append('g')
        .selectAll('dot')
        .data(inputdata)
        .enter()
        .append('circle')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 5)
            .style('fill', (d) => color(d.cluster.toString()));

    }, [data]);
  
    return <svg ref={svgRef} width={width} height={height} style={{ border: "1px solid black" }} />;
  
}