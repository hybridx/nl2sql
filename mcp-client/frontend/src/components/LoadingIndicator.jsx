import React from "react";
import { Spinner } from "@patternfly/react-core";

const LoadingIndicator = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <Spinner size="xl" aria-label="Loading content" />
    </div>
  );
};

export default LoadingIndicator;
