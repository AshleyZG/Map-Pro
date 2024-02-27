import './code-block.css';

export interface LabeledCodeBlock {
    codeLines: string[];
    labels: string[];
    fineGrainedLabels: string[];
    display: string;
    test: boolean;
    emessage: string;
    emessageByLine: string[];
	errorLabels: string[];
    blocks: string[];
    index: number[];
}

interface CodeBlockProps {
    content: string;
}

export const LabeledCodeBlockElement: React.FC<CodeBlockProps> = ({content}) => {

    return (
        <pre className={`labeled-code-block`}>
            <code>
            {content}
            </code>
        </pre>
    )
}