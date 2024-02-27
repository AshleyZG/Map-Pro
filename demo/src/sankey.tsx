import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

interface Node {
  name: string;
}

interface Link {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: Node[];
  links: Link[];
  nodes2Segments: {[key: string]: string[]};
}

interface SankeyDiagramProps {
    data: SankeyData;
    percentage: number; 
    updateSelectionFn: (codeSelection: string[]) => void;
}

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({data, percentage, updateSelectionFn}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [statePercentage, setPercentage] = useState<number>(1);

  useEffect(() => {
    if (!svgRef.current) return;

    setPercentage(percentage);
    
    const width = 800;
    const height = 600*percentage;

    // an initial data
    var inputdata: SankeyData = {
      nodes: [
        { name: "Node1" },
        { name: "Node2" },
        { name: "Node3" },
        // Add your nodes here
      ],
      links: [
        { source: 0, target: 1, value: 10 },
        { source: 1, target: 2, value: 15 },
        // Add your links here
      ],
      nodes2Segments: {},
    };
    // once passed data from the backend, update the data
    if (data.nodes.length > 0) {
        inputdata = data;
    }

    const sankeyGenerator = sankey<Node, Link>()
      .nodeWidth(20)
      .nodePadding(1)
      .extent([[1, 1], [width - 1, height - 5]]);

    const { nodes, links } = sankeyGenerator(inputdata);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear svg content before adding new elements

    const graph = svg.append("g");

    // Draw the links
    graph.append("g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .style("fill", "none")
      .style("stroke", "#000")
      .style("stroke-opacity", 0.2)
      .style("stroke-width", (d: any) => Math.max(1, d.width));
      

    // Draw the nodes
    graph.append("g")
      .selectAll("rect")
      .data(nodes)
      .enter()
      .append("rect")
      .attr('id', d => d.name)
      .attr("x", (d: any) => d.x0)
      .attr("y", (d: any) => d.y0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("width", sankeyGenerator.nodeWidth())
      .style("fill", "#555")
      .on("click", (event, d) =>{
          var codeList = inputdata.nodes2Segments[event.target.id];
          updateSelectionFn(codeList);
      });

    // Add titles for hover interaction
    graph.append("g")
      .style("font", "10px sans-serif")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("x", (d: any) => d.x0 - 6)
      .attr("y", (d: any) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")

  }, [data, percentage]);

  return <svg ref={svgRef} width="800" height={600*statePercentage} style={{ border: "1px solid black" }} />;
};

