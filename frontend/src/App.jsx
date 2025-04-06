import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Banner,
  Card,
  CardBody,
  CardTitle,
  ClipboardCopy,
} from "@patternfly/react-core";
import "@patternfly/react-core/dist/styles/base.css";
import "./index.css";

import QueryForm from "./components/QueryForm";
import LoadingIndicator from "./components/LoadingIndicator";
import ResultsTable from "./components/ResultsTable";
import AnalysisSection from "./components/AnalysisSection";

export default function App() {
  const [userInput, setUserInput] = useState("");
  const [enableAnalysis, setEnableAnalysis] = useState(false);
  const [isLoading, setisLoading] = useState(false);

  const fetchQuery = useMutation({
    mutationFn: async () => {
      setisLoading(true);
      const response = await fetch("http://127.0.0.1:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: userInput,
          analysis: enableAnalysis,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      setisLoading(false);
      return response.json();
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-[1440px]">
        {fetchQuery.data && (
          <div>
            <div className="flex items-center justify-end m-4">
              <Banner className="w-fit rounded-lg">{userInput}</Banner>
            </div>
            <div className="max-w-[1200px]">
              <Card>
                <CardBody>
                  <>
                    <ClipboardCopy isReadOnly className="mt-4">
                      {JSON.stringify(fetchQuery.data.sql, null, 2)}
                    </ClipboardCopy>

                    <ResultsTable data={fetchQuery.data.data} />
                    <div
                      style={{ borderTop: "1px solid gray", margin: "16px 0" }}
                    ></div>
                    {fetchQuery.data.analysis && enableAnalysis && (
                      <AnalysisSection
                        analysisContent={fetchQuery.data.analysis}
                      />
                    )}
                  </>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
        <div className="flex items-center justify-center">
          <div className="my-8 w-[1440px] flex items-center justify-center">
            <Card className="w-full">
              <CardTitle>Bee Assistant</CardTitle>
              <CardBody>
                <QueryForm
                  userInput={userInput}
                  setUserInput={setUserInput}
                  enableAnalysis={enableAnalysis}
                  setEnableAnalysis={setEnableAnalysis}
                  onSubmit={() => fetchQuery.mutate()}
                />
                {isLoading && <LoadingIndicator />}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
