import React from "react";
import { Table, Thead, Tr, Th, Td, Tbody } from "@patternfly/react-table";
import { Title } from "@patternfly/react-core";

const ResultsTable = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <>
      <Title className="py-4" headingLevel="h2">
        Results
      </Title>
      <div className=" overflow-x-auto max-w-[1440px] w-full">
        <div className="max-h-[800px] overflow-y-auto">
          <Table aria-label="Results table" variant="default" isStickyHeader>
            <Thead>
              <Tr>
                {Object.keys(data[0] || {}).map((key) => (
                  <Th key={key}>{key}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {data.map((row, index) => (
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
                      ) : typeof value === "string" && value.length > 30 ? (
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
    </>
  );
};

export default ResultsTable;
