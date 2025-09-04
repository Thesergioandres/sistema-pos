"use client";
import ReporteGeneral from "@/app/reportes/ReporteGeneral";
import { withRole } from "../../components/withRole";
import { useSession } from "next-auth/react";
function ReportePersonalizado() {
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  return <ReporteGeneral tipo="personalizado" sucursalId={sucursalId} />;
}
export default withRole(ReportePersonalizado, ["admin", "supervisor"]);
