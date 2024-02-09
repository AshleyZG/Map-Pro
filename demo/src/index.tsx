import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import reportWebVitals from './reportWebVitals';
import {SankeyData, SankeyDiagram} from './sankey';
import {generate_flow_data} from './utils';

function RootComponent(): JSX.Element {

    // TODO: store data
        const [data, setdata] = useState<any>([]);
        const [sankeyData, setSankeyData] = useState<SankeyData>({nodes: [], links: []});
        const [criteriaInput, setCriteriaInput] = useState<string|undefined>(undefined);


    const handleSubmit = () => {
        // TODO
        console.log('TODO: handleSubmit');
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
        <SankeyDiagram data={sankeyData}/>
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
