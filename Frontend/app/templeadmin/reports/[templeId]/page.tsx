import React from "react";
import TempleReportClient from "@/app/components/TempleReport";

// Define the props type
type TempleReportPageProps = {
  params: { templeId: string };
};

// Use the type to define the component's props
const TempleReport = ({ params }: TempleReportPageProps) => {
  return <TempleReportClient templeId={params.templeId} />;
};

// Export the component with a type cast to 'any'
export default TempleReport as any;
