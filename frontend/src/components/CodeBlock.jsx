import React, { useState } from "react";
import {
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  ClipboardCopyButton,
} from "@patternfly/react-core";

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
    </>
  );

  return (
    <div className="mb-4">
      <CodeBlock actions={codeBlockActions}>
        <CodeBlockCode id={blockId}>{code}</CodeBlockCode>
      </CodeBlock>
    </div>
  );
};

export default CodeBlock;
