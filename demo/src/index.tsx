import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import reportWebVitals from './reportWebVitals';
import {SankeyData, SankeyDiagram} from './sankey';
import {generate_flow_data, generate_flow_data_from_segs} from './utils';
import { PlotData, PlotDiagram } from './plot';
import { LabeledCodeBlockElement } from './code-block';

function RootComponent(): JSX.Element {

    // TODO: store data
        const [sankeyData, setSankeyData] = useState<SankeyData>({nodes: [], links: [], nodes2Segments: {}});
		const [plotData, setPlotData] = useState<PlotData[]>([]);
        const [criteriaInput, setCriteriaInput] = useState<string|undefined>(undefined);
		const [clusterNumber, setClusterNumberInput] = useState<number|undefined>(4);
		const [sortedClusterIDs, setSortedClusterIDs] = useState<number[]>([0, 1, 2, 3]);
		const [codeSelection, setCodeSelection] = useState<string[]>([]);

	// create refs
	const clusterNumberInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (event: React.MouseEvent) => {
        // TODO
		console.log(event.currentTarget);
        console.log('TODO: handleSubmit');
    }

	const handleClusterNumberSubmit = (event: React.MouseEvent) => {
		const newClusterNumber = parseInt(clusterNumberInputRef.current!.value);
		const newClusterIDs = new Array(newClusterNumber).fill(null).map((v, i) => i);

		if (clusterNumberInputRef.current){
			setClusterNumberInput(newClusterNumber);
		}

		const fetchData = async () => {
			try{
				const response = await fetch(`http://localhost:8000/getCodePosition?nClusters=${newClusterNumber}`);
				const jsonData = await response.json();

				const data = jsonData.data;
				setPlotData(data);

				const newSortedClusterIDs = newClusterIDs.sort((a, b) => {return -(data as any[]).filter(obj => (obj as any).cluster === a).length + (data as any[]).filter(obj  => (obj as any).cluster === b).length});
				setSortedClusterIDs(newSortedClusterIDs);

			} catch (error){
				console.log(error);
			}
		};

		fetchData();
	}

	const updateSelectionFn = (codeSelection: string[]) => {
		setCodeSelection(codeSelection);
	}

	useEffect(() => {
		const fetchData = async () => {
			try{
				// TODO: fetch data online
				const response = await fetch(`http://localhost:8000/getData`);
				const jsonData = await response.json();

				const data = jsonData.data;
                var newSankeyData = generate_flow_data(data.slice(0, 100));
                setSankeyData(newSankeyData);

			} catch (error){
				console.log(error);
			}
		};
		fetchData();
	}, []);

	return (
		<React.StrictMode>
			<div id="classifier-panel">
				<label htmlFor="criteria">Specify a criteria:</label>
				<input type="text" id="criteria" ref={(input) => setCriteriaInput(input?.value)} />
				<button onClick={handleSubmit}>Submit</button>
			</div>
			<div id="cluster-panel">
				<label htmlFor='cluster-number'>number of clusters</label>
				<input type="number" id="cluster-number" defaultValue={4} ref={clusterNumberInputRef} />
				<button onClick={handleClusterNumberSubmit}>Submit</button>
			</div>

			<div id="viz-panel">
				<PlotDiagram data={plotData} updateSelectionFn={updateSelectionFn}/>
				
				{sortedClusterIDs.map((v, i) => {
					return <SankeyDiagram key={i} 
						data={generate_flow_data_from_segs(plotData.filter(obj => obj.cluster === v))} 
						percentage={plotData.length===0 ? 1: plotData.filter(obj => obj.cluster === v).length/plotData.length} 
						updateSelectionFn={updateSelectionFn}
					/>
				})}
			</div>

			<div id="code-panel">
			
				{codeSelection.map((v, i) => {
					return <LabeledCodeBlockElement key={i} content={v}/>
				})}

			</div>
			
			{/* <SankeyDiagram data={sankeyData} percentage={1}/> */}
			
		</React.StrictMode>
	);
}


const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
  );
root.render(
	<RootComponent />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
