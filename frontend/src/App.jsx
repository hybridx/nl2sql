import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  ClipboardCopy,
  Checkbox,
  Spinner,
  TextInput,
  Alert,
  Title,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Td, Tbody } from "@patternfly/react-table";
import "@patternfly/react-core/dist/styles/base.css";
import "./index.css";

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
        <Card>
          <CardTitle>Bee Assistant</CardTitle>
          <CardBody>
            <div className="w-full rounded mb-2">
              <TextInput
                type="text"
                aria-label="Ask a question"
                placeholder="Ask a question..."
                value={userInput}
                onChange={(_event, value) => setUserInput(value)}
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
              <Button variant="primary" onClick={() => fetchQuery.mutate()}>
                Submit
              </Button>
            </div>

            {isLoading && (
              <>
                <div className="flex items-center justify-center">
                  <Spinner
                    size="xl"
                    aria-label="Contents of the basic example"
                  />
                </div>
              </>
            )}
            {fetchQuery.data && (
              <>
                <Title className="py-4" headingLevel="h2">
                  Results
                </Title>
                <ClipboardCopy isReadOnly>
                  {JSON.stringify(fetchQuery.data.sql, null, 2)}
                </ClipboardCopy>

                <div className="mt-4 overflow-x-auto max-w-[1440px] w-full">
                  <div className="max-h-[800px] overflow-y-auto mt-4">
                    <Table
                      aria-label="Results table"
                      variant="default"
                      isStickyHeader
                    >
                      <Thead>
                        <Tr>
                          {Object.keys(fetchQuery.data.data[0] || {}).map(
                            (key) => (
                              <Th key={key}>{key}</Th>
                            )
                          )}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {fetchQuery.data.data.map((row, index) => (
                          <Tr key={index} className="border">
                            {Object.entries(row).map(([key, value], i) => (
                              <Td
                                key={i}
                                dataLabel={key}
                                className="border p-2 text-sm truncate max-w-[200px]"
                              >
                                {typeof value === "string" &&
                                value.trim().startsWith("http") ? (
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 underline hover:text-blue-700"
                                  >
                                    {value.length > 30
                                      ? `${value.substring(0, 30)}...`
                                      : value}
                                  </a>
                                ) : typeof value === "string" &&
                                  value.length > 30 ? (
                                  `${value.substring(0, 30)}...`
                                ) : (
                                  value
                                )}
                              </Td>
                            ))}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </div>
                </div>

                {fetchQuery.data.analysis && (
                  <Alert
                    variant="info"
                    title="Analysis"
                    className="mt-4 p-4 bg-yellow-100 rounded"
                  >
                    {fetchQuery.data.analysis}
                  </Alert>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
