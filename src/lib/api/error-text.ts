import axios from "axios";

export function errorText(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
}
