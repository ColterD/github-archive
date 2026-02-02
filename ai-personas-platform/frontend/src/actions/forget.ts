export default async function forgetPassword(
    email: string,
  ): Promise<any> {
    let Data: any = null;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/forgotpassword`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      }
    );
    if (response.status === 201) {
      Data = await response.json();
    }
    return Data;
  }
  