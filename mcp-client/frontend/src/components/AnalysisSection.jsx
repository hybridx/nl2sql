import React, { useState } from "react";
import {
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  ClipboardCopyButton,
  Button,
} from "@patternfly/react-core";

const AnalysisSection = ({ analysisContent }) => {
  const [copiedStates, setCopiedStates] = useState({});

  // Function to handle clipboard copy
  const handleCopyToClipboard = (text, blockId) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [blockId]: true }));
  };

  // Function to handle copy button tooltip hidden
  const handleTooltipHidden = (blockId) => {
    setCopiedStates((prev) => ({ ...prev, [blockId]: false }));
  };

  // Function to format analysis content with proper code blocks
  const formatAnalysisContent = (content) => {
    if (!content) return null;

    const parts = content.split("```");

    return parts.map((part, index) => {
      if (index % 2 === 0) {
        return part.split("\n").map((line, i) =>
          line.trim() ? (
            <p key={`text-${index}-${i}`} className="mb-2">
              {line.startsWith("* ") ? (
                <li className="pl-2">{line.substring(2)}</li>
              ) : (
                line
              )}
            </p>
          ) : null
        );
      } else {
        const firstLineEnd = part.indexOf("\n");
        const code = firstLineEnd > 0 ? part.substring(firstLineEnd + 1) : part;
        const blockId = `code-block-${index}`;
        const isCopied = copiedStates[blockId] || false;

        const codeBlockActions = (
          <>
            <CodeBlockAction>
              <ClipboardCopyButton
                id={`copy-button-${blockId}`}
                textId={blockId}
                aria-label="Copy to clipboard"
                onClick={() => handleCopyToClipboard(code, blockId)}
                exitDelay={isCopied ? 1500 : 600}
                maxWidth="110px"
                variant="plain"
                onTooltipHidden={() => handleTooltipHidden(blockId)}
              >
                {isCopied
                  ? "Successfully copied to clipboard!"
                  : "Copy to clipboard"}
              </ClipboardCopyButton>
            </CodeBlockAction>
          </>
        );

        return (
          <div key={`code-${index}`} className="mb-4">
            <CodeBlock actions={codeBlockActions}>
              <CodeBlockCode id={blockId}>{code}</CodeBlockCode>
            </CodeBlock>
          </div>
        );
      }
    });
  };

  return (
    <div className="mt-6 mb-4">
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-md overflow-hidden">
        <div className="px-4 py-3 bg-blue-100">
          <h3 className="text-lg font-medium text-blue-800 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                clipRule="evenodd"
              ></path>
            </svg>
            Analysis
          </h3>
        </div>
        <div className="p-4 bg-white">
          {formatAnalysisContent(analysisContent)}
        </div>
      </div>
    </div>
  );
};

export default AnalysisSection;
