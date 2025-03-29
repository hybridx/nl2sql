import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import "./index.css";

export default function App() {
  const [userInput, setUserInput] = useState("");
  const [enableAnalysis, setEnableAnalysis] = useState(false);

  const fetchQuery = useMutation({
    mutationFn: async () => {
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
      return response.json();
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h1 className="text-xl font-bold mb-4">Bee Assistant</h1>
        <input
          type="text"
          className="w-full p-2 border rounded mb-2"
          placeholder="Ask a question..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            className="mr-2"
            checked={enableAnalysis}
            onChange={() => setEnableAnalysis(!enableAnalysis)}
          />
          Enable Analysis
        </label>
        <button
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          onClick={() => fetchQuery.mutate()}
          disabled={fetchQuery.isLoading}
        >
          {fetchQuery.isLoading ? "Loading..." : "Submit"}
        </button>
        {fetchQuery.isError && (
          <div className="mt-2 text-red-600">
            {fetchQuery.error.message}.{" "}
            <button
              className="text-blue-500"
              onClick={() => fetchQuery.mutate()}
            >
              Retry
            </button>
          </div>
        )}
        {fetchQuery.data && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Results</h2>
            <pre className="p-2 bg-gray-200 rounded text-sm overflow-auto">
              {JSON.stringify(fetchQuery.data.sql, null, 2)}
            </pre>
            <table className="w-full mt-2 border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  {Object.keys(fetchQuery.data.data[0] || {}).map((key) => (
                    <th key={key} className="border p-2">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fetchQuery.data.data.map((row, index) => (
                  <tr key={index} className="border">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="border p-2">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {fetchQuery.data.analysis && (
              <div className="mt-4 p-4 bg-yellow-100 rounded">
                <h2 className="text-lg font-semibold">Analysis</h2>
                <p>{fetchQuery.data.analysis}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
