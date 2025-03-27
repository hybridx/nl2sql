import React from "react";
import { Button } from "../ui/button";

export default function ChatTopbar() {
  const [models, setModels] = React.useState("");

  function handleModelChange(models: string) {
    setModels("llamma3:latest");
  }

  return (
    <div className="w-full flex px-4 py-6 items-center justify-between lg:justify-center ">
      <Button
        key={models}
        variant="ghost"
        className="w-full"
        onClick={() => {
          handleModelChange(models);
        }}
      >
        {models}
      </Button>
    </div>
  );
}
