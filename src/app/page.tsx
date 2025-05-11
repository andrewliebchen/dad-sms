import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/authOptions";
import { SignInButton } from "./sign-in-button";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/simulator");
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw' }}>
      <SignInButton />
    </div>
  );
}
