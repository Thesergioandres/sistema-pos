"use client";
import ReporteGeneral from "@/app/reportes/ReporteGeneral";
import { withRole } from "../../components/withRole";
import { useSession } from "next-auth/react";
function ReporteSemanal() {
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  return <ReporteGeneral tipo="semanal" sucursalId={sucursalId} />;
}
export default withRole(ReporteSemanal, ["admin", "supervisor"]);
