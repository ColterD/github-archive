export default async function Login(
  email: string,
  password: string
): Promise<any> {
  let Data: any = null;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );
  if (response.status === 200) {
    Data = await response.json();
  }
  return Data;
}
