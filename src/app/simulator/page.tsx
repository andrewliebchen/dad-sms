import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/authOptions";
import { SimulatorClient } from "./SimulatorClient";

export default async function SimulatorPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }
  return <SimulatorClient />;
}