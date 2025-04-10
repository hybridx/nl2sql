import React from "react";
import { Button, TextInput, Checkbox } from "@patternfly/react-core";

const QueryForm = ({
  userInput,
  setUserInput,
  enableAnalysis,
  setEnableAnalysis,
  onSubmit,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <>
      <div className="mb-4">
        <TextInput
          type="text"
          aria-label="Ask a question"
          placeholder="Ask a question..."
          value={userInput}
          onChange={(_event, value) => setUserInput(value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="mb-4">
        <Checkbox
          label="Enable Analysis"
          isChecked={enableAnalysis}
          onChange={(_event, checked) => setEnableAnalysis(checked)}
          id="enable-analysis"
        />
      </div>

      <div className="flex items-center justify-center mb-4">
        <Button variant="primary" onClick={onSubmit}>
          Submit
        </Button>
      </div>
    </>
  );
};

export default QueryForm;
