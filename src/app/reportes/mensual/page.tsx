"use client";
import ReporteGeneral from "@/app/reportes/ReporteGeneral";
import { withRole } from "../../components/withRole";
import { withPermission } from "../../components/withPermission";
import { useSession } from "next-auth/react";
function ReporteMensual() {
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  return <ReporteGeneral tipo="mensual" sucursalId={sucursalId} />;
}
export default withPermission(
  withRole(ReporteMensual, ["admin", "supervisor"]),
  ["reportes.ver"]
);
