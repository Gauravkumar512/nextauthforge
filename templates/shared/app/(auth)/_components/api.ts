import axios from "axios";

/** The most useful message from a failed API call (first field error, else the error text). */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const firstField = data?.fields ? Object.values(data.fields)[0] : undefined;
    return (typeof firstField === "string" ? firstField : data?.error) || "Something went wrong";
  }
  return "Something went wrong";
}

export function errorCode(error: unknown): string | undefined {
  return axios.isAxiosError(error) ? error.response?.data?.code : undefined;
}
