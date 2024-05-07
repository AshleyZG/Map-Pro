import { SankeyData } from "./sankey";
import { PlotData } from "./plot";

export function generate_flow_data (data: any): SankeyData{
    var nodeIDMap: {[key: string]: number} = {};
    var linkIDMap: {[key: string]: number} = {};
    var results: SankeyData = {nodes: [], links: [], nodes2Segments: {}};
    data.forEach((items: any) => {
        items.forEach((item: any, idx: number) => {
            // update nodes first
            if (!(`N${item.id}L${idx}` in nodeIDMap)){
                nodeIDMap[`N${(item.id)}L${idx}`] = results.nodes.length;
                results.nodes.push({name: `N${item.id}L${idx}`});
            }
            
            // if not the first level, update links as well
            if (idx > 0){
                var source = nodeIDMap[`N${items[idx-1].id}L${idx-1}`];
                var target = nodeIDMap[`N${(item.id)}L${idx}`];

                if (!(`S${source}T${target}L${idx}` in linkIDMap)){
                    linkIDMap[`S${source}T${target}L${idx}`] = results.links.length;
                    results.links.push({source: source, target: target, value: 0});
                }
                results.links[linkIDMap[`S${source}T${target}L${idx}`]].value += 1;
            }
        });
    })
    return results;
    
}


export function generate_flow_data_from_segs(data: PlotData[]): SankeyData{
    var nodeIDMap: {[key: string]: number} = {};
    var linkIDMap: {[key: string]: number} = {};
    var results: SankeyData = {nodes: [], links: [], nodes2Segments: {}};
    data.forEach((items: PlotData) => {
        items.segLabels.forEach((item: any, idx: number) => {
            // update nodes first
            if (!(`N${item}L${idx}` in nodeIDMap)){
                nodeIDMap[`N${(item)}L${idx}`] = results.nodes.length;
                results.nodes2Segments[`N${(item)}L${idx}`] = [];
                results.nodes.push({name: `N${item}L${idx}`});
            }
            results.nodes2Segments[`N${(item)}L${idx}`].push(items.segments[idx]);
            
            // if not the first level, update links as well
            if (idx > 0){
                var source = nodeIDMap[`N${items.segLabels[idx-1]}L${idx-1}`];
                var target = nodeIDMap[`N${(item)}L${idx}`];

                if (!(`S${source}T${target}L${idx}` in linkIDMap)){
                    linkIDMap[`S${source}T${target}L${idx}`] = results.links.length;
                    results.links.push({source: source, target: target, value: 0});
                }
                results.links[linkIDMap[`S${source}T${target}L${idx}`]].value += 1;
            }
        });
    })
    return results;
}

export function calculateMean(arr: number[]): number {
    const sum = arr.reduce((acc, curr) => acc + curr, 0);
    return sum / arr.length;
  }


export  function findMostCommonItem<T>(array: T[]): T {
    // if (array.length === 0) return null;

    const countMap: Map<T, number> = new Map();
    let mostCommonItem: T = array[0];
    let maxCount: number = 1;

    for (const item of array) {
        const count = (countMap.get(item) || 0) + 1;
        countMap.set(item, count);

        if (count > maxCount) {
            mostCommonItem = item;
            maxCount = count;
        }
    }

    return mostCommonItem;
}


export function findKeyOfMaxValue(obj: Record<string, number>): string | null {
    let maxKey: string | null = null;
    let maxValue: number = -Infinity;

    // Iterate over each entry in the object
    Object.entries(obj).forEach(([key, value]) => {
        if (maxValue < value) {
            maxValue = value;
            maxKey = key;
        }
    });

    return maxKey;
}

export function mergeDictionariesWithUniqueKeys<T>(dict1: Record<string, T>, dict2: Record<string, T>, suffix: string = "_dup"): Record<string, T> {
    const merged: Record<string, T> = { ...dict1 };

    for (const [key, value] of Object.entries(dict2)) {
        let newKey = key;
        // If the key exists, append a suffix and check again until a unique key is found
        while (merged.hasOwnProperty(newKey)) {
            newKey += suffix;
        }
        merged[newKey] = value;
    }

    return merged;
}