import React, { useRef, useEffect, createElement } from 'react';
import * as d3 from 'd3';
import { PlotData } from './plot';
import { calculateMean, findMostCommonItem, findKeyOfMaxValue, mergeDictionariesWithUniqueKeys } from './utils';
import { act } from '@testing-library/react';

import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import 'highlight.js/styles/github.css'; // Choose the style you prefer

hljs.registerLanguage('python', python);


interface MapViewProps {
    data: PlotData[];
    keystrokeData: any;
    updateSelectionFn: (codeSelection: string[]) => void;

}

const highlightCode = (code: string): string => {
    // Highlight and return as HTML string
    const highlightedCode = hljs.highlight(code, { language: 'python' }).value;
    return `<pre>${highlightedCode}</pre>`
  };

interface TreeNode {
    id?: number;
    merged?: boolean;
    labelList?: number[];
    label: number;
    value: number;
    codeList: string[];
    children: {[key: number]: TreeNode};
}

interface TreeNodeElement {
    height: number;
    width: number;
    depth: number;
    xOffset: number;
    yOffset: number;
    label: number;
    codeList: string[];
}

export const MapView: React.FC<MapViewProps> = ({data, keystrokeData, updateSelectionFn}) => {

    const WIDTH = 800;
    const HEIGHT = 600;
    const root: TreeNode = {value: 0, label: 0, codeList: [], children:{}};

    const svgRef = useRef<SVGSVGElement>(null);

    const scalerX = d3.scaleLinear().domain([0, 1500]).range([0, WIDTH]);
    const scalerY = d3.scaleLinear().domain([0,20]).range([0, HEIGHT]);

    const activeUsers = Object.keys(keystrokeData);

    const initializeGraph =  () => {
        // add dots on the svg
        const svg = d3.select(svgRef.current);
        const graph = svg.append("g");

        graph.append("g")
        var dots = graph.selectAll('.current-dot')
            .data(activeUsers)
            .enter()
            .append('g')
            .attr('class', 'current-dot')
            .attr('id', function(d, i){return d});
        dots.append('circle')
            .attr('r', 2)
            .attr('cx', '0')
            .attr('cy', 0)
            .attr('fill', function(d, i){return 'orange'})
    };

    const updateGraph = (user: string, keystrokeEvent: any) => {
        if (keystrokeEvent.activeSegID === null){
            return;
        }

        let dot = d3.selectAll('.current-dot').select(function(d, i){return d===user?  this : null}).select('circle');

        // find out the block it should be in
        let MIN = 1000;
        let xOffset: any = undefined;
        let yOffset: any = undefined;
        let width: any = undefined;
        let height: any = undefined; 
        
        d3.selectAll('.tree-node').select(function(d, i){return (d as any).label===keystrokeEvent.segmentsLabels[keystrokeEvent.activeSegID] || (d as TreeNode).labelList?.includes(keystrokeEvent.segmentsLabels[keystrokeEvent.activeSegID])? this: null})
            .each(function(d: any, i){
                if (Math.max(d.depth-keystrokeEvent.activeSegID, keystrokeEvent.activeSegID-d.depth)<MIN){
                    MIN = Math.max(d.depth-keystrokeEvent.activeSegID, keystrokeEvent.activeSegID-d.depth);
                    xOffset = d.xOffset;
                    yOffset = d.yOffset;
                    width = d.width;
                    height = d.height;
                }
            });


        // to fix the NaN bug, need to remove in the future
        xOffset = xOffset === undefined ? 0 : xOffset;
        yOffset = yOffset === undefined ? 0 : yOffset;
        width = width === undefined ? 0 : 100; 
        height = height === undefined ? 0: 100;

        // update dot position
        dot.transition()
            .duration(50)
            .attr('cx', xOffset!+keystrokeEvent.xPos*width!)
            .attr('cy', yOffset!+keystrokeEvent.progress*height!)
            .attr('fill', (keystrokeEvent.type==='run' && keystrokeEvent.passTest) ? 'blue':'orange');


    }


    const replayKeystroke = (event: React.MouseEvent) => {
        // initialize graph
        initializeGraph();

        // update graph as keystroke events
        activeUsers.forEach((user: string) => {
            keystrokeData[user].forEach((keystrokeEvent: any, idx: number) => {
                setTimeout(() => {
                    updateGraph(user, keystrokeEvent); 
                }, 100*idx);
            })
        })

    }


    useEffect(() => {
        if (!svgRef.current) return;
    
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear svg content before adding new elements  

        // put data in tree structure
        data.forEach((item: PlotData) => {
            root.value += 1;
            root.codeList.push(item.code);
            // add root level children
            if (! (item.correctedCluster in root.children)){
                root.children[item.correctedCluster] = {value: 0, label: item.correctedCluster, codeList: [], children:{}};
            }
            root.children[item.correctedCluster].value += 1;
            root.children[item.correctedCluster].codeList.push(item.code);

            // go through each segment label and add to children
            var curNode = root.children[item.correctedCluster];
            item.segLabels.forEach((label: number, idx: number) => {
                if (!(label in curNode.children)){
                    curNode.children[label] = {value: 0, label: label, codeList: [], children: {}};
                }
                curNode.children[label].value += 1;
                curNode.children[label].codeList.push(item.segments[idx]);
                curNode = curNode.children[label];
            })
        });


        function getNodeAsRootDepth(node: TreeNode): {[key: number]: number} {
            let curLength = findMostCommonItem(node.codeList.map((v) => v.split('\n').length));
            let curDepth: {[key: number]: number} = {};
            curDepth[curLength] = node.value; 

            let entries = Object.entries(node.children);

            if (entries.length === 0) {
                return curDepth;
            }

            let results: {[key: number]: number} = {};

            entries.forEach((item) => {
                let childDepth = getNodeAsRootDepth(item[1]);
                for (let key in childDepth) {
                    let tmpLength = parseInt(key);
                    if ((curLength+tmpLength) in results){
                        results[curLength+tmpLength] += childDepth[tmpLength];
                    }
                    else{
                        results[curLength+tmpLength] = childDepth[tmpLength];
                    }
                }
            })
            return results;
        }

        function createTreeElements(node: TreeNode, depth: number, xOffset: number, yOffset: number): TreeNodeElement[]{

            const MERGE_THRESHOLD = 100;
            let curElement: TreeNodeElement | undefined = undefined;
            if (node.value < MERGE_THRESHOLD){
                let nodeAsRootDepth: {[key: number]: number} = getNodeAsRootDepth(node);
                let blockLength: number = parseInt(findKeyOfMaxValue(nodeAsRootDepth)!);

                curElement = {height: scalerY(blockLength), 
                                width: scalerX(node.value), 
                                depth: depth,   
                                xOffset: xOffset, 
                                yOffset: yOffset, 
                                label: node.label, 
                                codeList: node.codeList};
                return [curElement];
            }

            curElement = {height: scalerY(findMostCommonItem(node.codeList.map((v) => v.split('\n').length))), 
                            width: scalerX(node.value), 
                            depth: depth,   
                            xOffset: xOffset, 
                            yOffset: yOffset, 
                            label: node.label, 
                            codeList: node.codeList};

            var results: TreeNodeElement[] = [curElement];

            var sortedEntries = Object.entries(node.children).sort((a, b) => b[1].value - a[1].value);
            var curXOffset: number = xOffset;

            var curYOffset: number = yOffset+scalerY(findMostCommonItem(node.codeList.map((v) => v.split('\n').length)));

            let mergedNode: TreeNode | null = null;
            for (let item of sortedEntries){

                if (item[1].value<MERGE_THRESHOLD){
                    if (mergedNode === null){
                        mergedNode = {
                            merged: true,
                            labelList: [],
                            label: item[1].label,
                            value: 0,
                            codeList: [],
                            children: {},
                        }
                    }
                    mergedNode.labelList?.push(item[1].label);
                    mergedNode.value += item[1].value;
                    mergedNode.codeList = mergedNode.codeList.concat(item[1].codeList);
                    mergedNode.children = mergeDictionariesWithUniqueKeys(mergedNode.children, item[1].children);
                }
                else{
                    results = results.concat(createTreeElements(item[1], depth+1, curXOffset, curYOffset));
                    curXOffset += scalerX(item[1].value);    
                }
            }

            if (mergedNode!== null){
                results = results.concat(createTreeElements(mergedNode, depth+1, curXOffset, curYOffset));
            }

            return results;
        }

        // visualize tree structure
        var treeElements: TreeNodeElement[] = [];
        var curXOffset: number = 0;


        for (let child in root.children){
            let sortedEntries = Object.entries(root.children[child].children).sort((a, b) => b[1].value - a[1].value);
            for (let item of sortedEntries){
                treeElements = treeElements.concat(createTreeElements(item[1], 0, curXOffset, 0));
                curXOffset += scalerX(item[1].value);
            }
        }

        console.log(treeElements);

        const graph = svg.append("g");


        // Draw the nodes
        graph.append("g")
        .selectAll("rect")
        .data(treeElements)
        .enter()
        .append("rect")
        .attr("class", "tree-node")
        .attr("width", (d: any) => d.width)
        .attr("height", (d: any) => d.height)
        .attr("y", (d: any) => d.yOffset)
        .attr("x", (d: any) => d.xOffset)
        .style("fill", "#555")
        .style("opacity", "0.5")
        .style("stroke","black")
        .on("click", (event, d) =>{
            let codeList = d.codeList;
            updateSelectionFn(codeList);
        });

        const htmlContent = `
        <div xmlns="http://www.w3.org/1999/xhtml" style="border: 1px solid black; border-radius: 5px; padding: 10px;">
          <p>This is HTML content inside an SVG.</p>
          <button>Click Me</button>
        </div>
      `


       treeElements.forEach((item) => {
        svg.append('foreignObject')
            .attr("width", item.width)
            .attr("height", item.height)
            .attr("y", item.yOffset)
            .attr("x", item.xOffset)
            .append('xhtml:body') // Use xhtml:body to ensure proper rendering
            .style('font', '14px "Helvetica Neue"')
            .html(highlightCode(item.codeList[0])) // Set the highlighted code as HTML
            .on("click", (event, d) => {
                updateSelectionFn(item.codeList);
            });
       })


    }, [data, keystrokeData]);
    



    return <div>
            <button onClick={replayKeystroke}>Replay</button>

            <svg xmlns="http://www.w3.org/2000/svg" ref={svgRef} width={WIDTH} height={HEIGHT} style={{ border: "1px solid black" }} >

                {/* <foreignObject width="100%" height="100%">
                <div dangerouslySetInnerHTML={htmlContent}></div>

                </foreignObject> */}
            </svg>
            {/* {highlightCode(`print('hello')\nprint(a)`)} */}
        </div>;
  
}