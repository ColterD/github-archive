export default async function GetUser(tocken : string): Promise<any> {
    let Data: any = null;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/getuser`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tocken}`,
        },
             }
    );
    if (response.status === 200) {
      Data = await response.json();
    }
    return Data;
  }
  