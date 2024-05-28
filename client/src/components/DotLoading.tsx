"use client";

import { useEffect, useState } from "react";

const DotLoading = () => {
  let [count, setCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prevCount) => (prevCount % 3) + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const dots = ".".repeat(count);
  return <>{dots}</>;
};

export default DotLoading;
