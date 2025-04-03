import React, { useState } from "react";
import {
  CodeBlock as PFCodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  ClipboardCopyButton,
  Button,
} from "@patternfly/react-core";
import { PlayIcon } from "@patternfly/react-icons";

const CodeBlock = ({ code, language, blockId = "code-block" }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
  };

  const handleTooltipHidden = () => {
    setIsCopied(false);
  };

  const codeBlockActions = (
    <>
      <CodeBlockAction>
        <ClipboardCopyButton
          id={`copy-button-${blockId}`}
          textId={blockId}
          aria-label="Copy to clipboard"
          onClick={handleCopyToClipboard}
          exitDelay={isCopied ? 1500 : 600}
          maxWidth="110px"
          variant="plain"
          onTooltipHidden={handleTooltipHidden}
        >
          {isCopied ? "Successfully copied to clipboard!" : "Copy to clipboard"}
        </ClipboardCopyButton>
      </CodeBlockAction>
      <CodeBlockAction>
        <Button variant="plain" aria-label="Play icon" icon={<PlayIcon />} />
      </CodeBlockAction>
    </>
  );

  return (
    <div className="mb-4">
      {language && (
        <div className="bg-gray-700 text-white text-xs px-4 py-1 rounded-t">
          {language}
        </div>
      )}
      <PFCodeBlock actions={codeBlockActions}>
        <CodeBlockCode id={blockId}>{code}</CodeBlockCode>
      </PFCodeBlock>
    </div>
  );
};

export default CodeBlock;
