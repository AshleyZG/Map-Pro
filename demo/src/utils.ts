import { SankeyData } from "./sankey";


export function generate_flow_data (data: any): SankeyData{
    var nodeIDMap: {[key: string]: number} = {};
    var linkIDMap: {[key: string]: number} = {};
    var results: SankeyData = {nodes: [], links: []};
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