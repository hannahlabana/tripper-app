import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.CSC_API_KEY;

    if (!apiKey) {
      console.error("CSC_API_KEY is not set");
      return NextResponse.json(
        { error: "CSC_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.countrystatecity.in/v1/countries", {
      headers: {
        "X-CSCAPI-KEY": apiKey,
      },
      // Avoid caching in dev to see changes immediately
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch countries:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch countries from upstream API" },
        { status: response.status }
      );
    }

    const countries = await response.json();
    return NextResponse.json(countries);
  } catch (err) {
    console.error("Unexpected error fetching countries", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

