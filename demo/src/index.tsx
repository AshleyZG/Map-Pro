import React, { useEffect, useState, useRef, useReducer } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import reportWebVitals from './reportWebVitals';
import {SankeyData, SankeyDiagram, AnnotatedMapDiagram} from './sankey';
import {generate_flow_data, generate_flow_data_from_segs} from './utils';
import { PlotData, PlotDiagram } from './plot';
import { LabeledCodeBlockElement } from './code-block';
import { MapView } from './map-view';

function RootComponent(): JSX.Element {

		const [plotData, setPlotData] = useState<PlotData[]>([]);
		const [keystrokeData, setKeystrokeData] = useState<any>({});
        const [criteriaInput, setCriteriaInput] = useState<string|undefined>(undefined);
		const [clusterNumber, setClusterNumberInput] = useState<number|undefined>(4);
		const [sortedClusterIDs, setSortedClusterIDs] = useState<number[]>([0, 1, 2, 3]);
		const [codeSelection, setCodeSelection] = useState<string[]>([]);

	// create refs
	const clusterNumberInputRef = useRef<HTMLInputElement>(null);
	const VizRef = useRef<SVGElement>(null);

    const handleSubmit = (event: React.MouseEvent) => {
        // TODO
		console.log(event.currentTarget);
        console.log('TODO: handleSubmit');
    }

	const replayKeystroke = (event: React.MouseEvent) => {
		console.log("replayKeystroke");	

		const fetchData = async () => {
			try{
				const response = await fetch(`http://localhost:8000/getKeystrokeData`);
				const jsonData = await response.json();

				const keystroke = jsonData.keystroke; 
				console.log(keystroke);

			} catch (error){
				console.log(error);
			}
		};

		fetchData();

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
				const keystroke = jsonData.keystroke; 

				setPlotData(data);
				setKeystrokeData(keystroke);

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
				const keystroke = jsonData.keystroke; 

				setPlotData(data);
				setKeystrokeData(keystroke);

				const newSortedClusterIDs = newClusterIDs.sort((a, b) => {return -(data as any[]).filter(obj => (obj as any).cluster === a).length + (data as any[]).filter(obj  => (obj as any).cluster === b).length});
				setSortedClusterIDs(newSortedClusterIDs);

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
				<button onClick={replayKeystroke}>Replay</button>
			</div>

			<div id="viz-panel">
				<PlotDiagram data={plotData} updateSelectionFn={updateSelectionFn}/>
				
				<MapView data={plotData} keystrokeData={keystrokeData} updateSelectionFn={updateSelectionFn}/>

			</div>

			<div id="code-panel">
			
				{codeSelection.map((v, i) => {
					return <LabeledCodeBlockElement key={i} content={v}/>
				})}

			</div>
						
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
