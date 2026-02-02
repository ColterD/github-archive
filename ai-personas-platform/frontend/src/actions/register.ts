import { UsersCreateInput } from "@/components/auth";

export default async function register(data: UsersCreateInput): Promise<any> {
  let Data: any = null;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
  if (response.status === 200) {
    Data = await response.json();
  }
  return Data;
}
