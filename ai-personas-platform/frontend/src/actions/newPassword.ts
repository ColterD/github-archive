export default async function NewPass(
    email: string,
    newPassword: string,
  ): Promise<any> {
    let Data: any = null;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/forgotpassword/confirmation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      }
    );
    if (response.status === 201) {
      Data = await response.json();
    }
    return Data;
  }
  