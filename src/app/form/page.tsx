"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

import { ChevronDownIcon, ChevronLeftIcon } from "@heroicons/react/20/solid";

import {
  DatePicker,
  Input,
  Radio,
  Tag,
  AutoComplete
} from "antd";
import type { RadioChangeEvent } from "antd";
import type { ColumnsType } from "antd/es/table";

import dayjs from "dayjs";

const { RangePicker } = DatePicker;

declare global {
  interface Window {
    google: typeof google;
  }
}

type Budget = "> 500 USD" | "> 1000 USD" | "> 2000 USD" | "< 2500 USD";
type Transport = "Public Transport" | "Driving" | "No" | "";

type FormData = {
  country: string;
  city: string;

  flightsBooked: boolean;

  flightDateRange: any | null; 
  flightDateStrings: [string, string] | null;

  arrivalTime: string | null;  
  departureTime: string | null;

  tripDays: number;

  hotelBooked: boolean;
  hotelName: string;

  hotelDateRange: any | null;
  hotelDateStrings: [string, string] | null;

  vibeTags: string[];
  vibeOther: string;

  mustDo: string;

  budget: Budget;
  dietary: string;
  transport: Transport;
};

type ItineraryResponse = {
  itineraryTitle: string;
  location: {
    country: string;
    city: string;
  };
  tripSummary: {
    totalDays: number;
    withElderly: boolean;
    dietary: string;
    transport: string;
    budget: string;
  };
  days: {
    dayNumber: number;
    dateLabel: string;
    dayTitle: string;
    schedule: {
      time: string;
      type: string;
      title: string;
      description: string;
      location: {
        name: string;
        area: string;
      };
      mealType: string | null;
      restaurant: {
        name: string;
        cuisine: string;
        dietaryConfidence: string;
      } | null;
    }[];
  }[];
  notes: string[];
};

const loadingMessages = [
  "🚀 Creating your dream vacation...",
  "🧳 Packing your bags...",
  "📍 Planning your adventures...",
  "☕ Brewing some excitement...",
];

const TOTAL_STEPS = 9;

const COUNTRY_FALLBACK_OPTIONS = [
  { name: "Japan", iso2: "JP" },
  { name: "Philippines", iso2: "PH" },
];
const STATE_FALLBACK_OPTIONS = ["Aichi", "Tokyo"];

const VIBE_TAGS = [
  "👵🏻 With Elderly",
  "👶🏻 Kid-friendly",
  "🥂 Bars & Clubs",
  "⛰️ Hikes & Nature Walks",
  "🔥 Tourist Hotspots",
  "🍝 Food Trips",
  "👚 Thrift Shopping",
  "🛍️ Luxury Shopping",
  "💬 Others",
];

const BUDGET_TAGS: Exclude<Budget, "">[] = ["> 500 USD", "> 1000 USD", "> 2000 USD", "< 2500 USD"];

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [countryOptions, setCountryOptions] = useState(COUNTRY_FALLBACK_OPTIONS);
  const [stateOptions, setStateOptions] = useState<string[]>(STATE_FALLBACK_OPTIONS);
  const [formData, setFormData] = useState<FormData>({
    country: "Japan",
    city: "Aichi",
  
    flightsBooked: true,
    flightDateRange: null,
    flightDateStrings: null,
    arrivalTime: null,
    departureTime: null,
  
    tripDays: 3,
  
    hotelBooked: true,
    hotelName: "",
    hotelDateRange: null,
    hotelDateStrings: null,
  
    vibeTags: [],
    vibeOther: "",
  
    mustDo: "",
  
    budget: "> 500 USD",
    dietary: "",
    transport: "",
  });

  const [mapsReady, setMapsReady] = useState(false);
  const [hotelSuggestions, setHotelSuggestions] = useState<string[]>([]);

  const isOthersSelected = formData.vibeTags.includes("💬 Others");

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return "What country & city are you planning to go to?";
      case 2:
        return "Have you booked the flights already?";
      case 3:
        return "Have you booked the hotel?";
      case 4:
        return "What's the vibe?";
      case 5:
        return "Do you have places or activities that are in your must-do list?";
      case 6:
        return "What's the budget?";
      case 7:
        return "Any dietary restrictions? Type N/A if none";
      case 8:
        return "Have you already settled how you'll get around?";
      default:
        return "Trip form";
    }
  }, [step]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function goNext() {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  useEffect(() => {
    if (!formData.flightsBooked) {
      update("flightDateRange", null);
      update("flightDateStrings", null);
      update("arrivalTime", null);
      update("departureTime", null);
    }
  }, [formData.flightsBooked]);

  useEffect(() => {
    if (!isOthersSelected && formData.vibeOther) {
      update("vibeOther", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOthersSelected]);

  useEffect(() => {
    let cancelled = false;

    const loadCountries = async () => {
      try {
        const response = await fetch("https://api.countrystatecity.in/v1/countries", {
          headers: {
            "X-CSCAPI-KEY": "51ca5492f35cbcc898b90404a54473a1343a56cf3a6b03c72c37296191d10f45",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch countries", response.status, response.statusText);
          return;
        }

        const countries = await response.json();
        if (!cancelled && Array.isArray(countries)) {
          const parsed = countries
            .filter(
              (c: any) => typeof c?.name === "string" && typeof c?.iso2 === "string"
            )
            .map((c: any) => ({ name: c.name as string, iso2: c.iso2 as string }));

          if (parsed.length) {
            setCountryOptions(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to load countries", e);
      }
    };

    loadCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadStates = async () => {
      try {
        const selected = countryOptions.find((c) => c.name === formData.country);
        if (!selected || !selected.iso2) return;

        const response = await fetch(
          `https://api.countrystatecity.in/v1/countries/${selected.iso2}/states`,
          {
            headers: {
              "X-CSCAPI-KEY": "51ca5492f35cbcc898b90404a54473a1343a56cf3a6b03c72c37296191d10f45",
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch states", response.status, response.statusText);
          return;
        }

        const states = await response.json();
        if (!cancelled && Array.isArray(states)) {
          const names = states
            .map((s: any) => s?.name)
            .filter((n: unknown): n is string => typeof n === "string");

          if (names.length) {
            setStateOptions(names);

            if (!names.includes(formData.city)) {
              update("city", names[0]);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load states", e);
      }
    };

    loadStates();

    return () => {
      cancelled = true;
    };
  }, [formData.country, countryOptions]);

  useEffect(() => {
    if (step !== 3) return;
    if (!mapsReady) return;
    if (!window.google?.maps?.places?.AutocompleteService) return;

    const q = formData.hotelName.trim();
    if (q.length < 2) {
      setHotelSuggestions([]);
      return;
    }

    const t = window.setTimeout(() => {
      const service = new window.google.maps.places.AutocompleteService();
      service.getQueryPredictions({ input: q }, (predictions, status) => {
        if (
          status !== window.google.maps.places.PlacesServiceStatus.OK ||
          !predictions
        ) {
          setHotelSuggestions([]);
          return;
        }
        setHotelSuggestions(predictions.slice(0, 8).map((p) => p.description));
      });
    }, 200);

    return () => window.clearTimeout(t);
  }, [formData.hotelName, mapsReady, step]);

  function toggleVibeTag(tag: string, checked: boolean) {
    setFormData((prev) => {
      const exists = prev.vibeTags.includes(tag);
      if (checked && !exists) return { ...prev, vibeTags: [...prev.vibeTags, tag] };
      if (!checked && exists)
        return { ...prev, vibeTags: prev.vibeTags.filter((t) => t !== tag) };
      return prev;
    });
  }

  const { RangePicker } = DatePicker;
  const { TextArea } = Input;

  const transportOnChange = (e: RadioChangeEvent) => {
    update("transport", (e.target.value ?? "") as Transport);
  };

  const onFinish = async () => {
    setStatus("submitting");
    setError(null);
  
    try {
      const response = await fetch(
        "https://hannahlabana.app.n8n.cloud/webhook/fc55e808-3dd6-4e56-a823-4b20f450ad19",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
  
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  
      const raw = await response.json();
  
      // save itinerary temporarily in sessionStorage to access on the new page
      sessionStorage.setItem("generatedItinerary", JSON.stringify(raw));
  
      setStatus("success");
  
      // navigate to itinerary page
      router.push("/itinerary");
    } catch (e: any) {
      console.error("Failed to submit trip data", e);
      setStatus("error");
      setError(e?.message ?? "Something went wrong");
    }
  };

  const [currentMessage, setCurrentMessage] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (status !== "submitting") return;

    const interval = setInterval(() => {
      // fade out
      setFade(false);

      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
        setFade(true);
      }, 500); // match the transition duration
    }, 2500); // show each message for 2.5s

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="mx-auto max-w-xl p-6">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyDS8GCWpPlHQrDi3fgqk-4qlT9B0IsxMG4&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapsReady(true)}
      />

      <div className="flex items-center justify-between gap-4">
        {step === 1 ? (
          <Link className="flex flex-row gap-0" href="/">
            <ChevronLeftIcon
              aria-hidden="true"
              className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
            />
            Exit
          </Link>
        ) : (
          <button type="button" className="flex flex-row gap-0" onClick={goBack}>
            <ChevronLeftIcon
              aria-hidden="true"
              className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
            />
            Back
          </button>
        )}

        <div className="text-sm text-gray-500">
          Step {step} / {TOTAL_STEPS}
        </div>
      </div>

      <h1 className="mt-4 text-xl font-semibold">{stepTitle}</h1>

      {/* Step 1 */}
      <div className={step === 1 ? "mt-4" : "hidden"}>
        <label htmlFor="country" className="block text-sm/6 font-medium text-gray-900">
          Country
        </label>
        <div className="grid shrink-0 grid-cols-1 focus-within:relative">
          <select
            id="country"
            name="country"
            aria-label="country"
            value={formData.country}
            onChange={(e) => update("country", e.target.value)}
            className="col-start-1 row-start-1 w-full appearance-none rounded-md py-1.5 pr-7 pl-3 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          >
            {countryOptions.map((c) => (
              <option key={c.iso2} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
          />
        </div>

        <label htmlFor="city" className="mt-4 block text-sm/6 font-medium text-gray-900">
          State / Region
        </label>
        <div className="grid shrink-0 grid-cols-1 focus-within:relative">
          <select
            id="city"
            name="city"
            aria-label="state"
            value={formData.city}
            onChange={(e) => update("city", e.target.value)}
            className="col-start-1 row-start-1 w-full appearance-none rounded-md py-1.5 pr-7 pl-3 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          >
            {stateOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
          />
        </div>
      </div>

      {/* Step 2 */}
      <div className={step === 2 ? "mt-4" : "hidden"}>
        <div className="flex gap-10">
          <div className="inline-flex items-center py-3">
            <label className="relative flex items-center cursor-pointer">
              <input
                name="flights"
                type="radio"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-slate-400 transition-all"
                checked={formData.flightsBooked === true}
                onChange={() =>
                  setFormData((p) => ({
                    ...p,
                    flightsBooked: true,
                    tripDays: p.tripDays || 3,
                  }))
                }
              />
              <span className="absolute bg-slate-800 w-3 h-3 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </label>
            <label
              className="ml-2 text-slate-600 cursor-pointer text-sm"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  flightsBooked: true,
                  tripDays: p.tripDays || 3,
                }))
              }
            >
              Yes
            </label>
          </div>

          <div className="inline-flex items-center py-3">
            <label className="relative flex items-center cursor-pointer">
              <input
                name="flights"
                type="radio"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-slate-400 transition-all"
                checked={formData.flightsBooked === false}
                onChange={() =>
                  setFormData((p) => ({
                    ...p,
                    flightsBooked: false,
                    flightDateRange: null,
                    flightDateStrings: null,
                  }))
                }
              />
              <span className="absolute bg-slate-800 w-3 h-3 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </label>
            <label
              className="ml-2 text-slate-600 cursor-pointer text-sm"
              onClick={() =>
                setFormData((p) => ({
                  ...p,
                  flightsBooked: false,
                  flightDateRange: null,
                  flightDateStrings: null,
                }))
              }
            >
              No
            </label>
          </div>
        </div>

        {formData.flightsBooked && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Arrival date & time
              </label>
              <DatePicker
              showTime
              className="w-full"
              placeholder="Select arrival date & time"
              value={formData.arrivalTime ? dayjs(formData.arrivalTime) : null}
              onChange={(date) => update("arrivalTime", date ? date.toISOString() : null)}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              disabledTime={(current) => {
                if (!current) return {};
                const now = dayjs();
                if (current.isSame(now, 'day')) {
                  return {
                    disabledHours: () => Array.from({ length: now.hour() }, (_, i) => i),
                    disabledMinutes: (hour) => (hour === now.hour() ? Array.from({ length: now.minute() }, (_, i) => i) : []),
                  };
                }
                return {};
              }}
            />

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Departure date & time
              </label>
              <DatePicker
                showTime
                className="w-full"
                placeholder="Select departure date & time"
                value={formData.departureTime ? dayjs(formData.departureTime) : null}
                onChange={(date) =>
                  update("departureTime", date ? date.toISOString() : null)
                }
              />
            </div>
          </div>
        )}

        {!formData.flightsBooked && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900 mb-1">
              How many days do you plan to stay?
            </label>
            <Input
              type="number"
              min={1}
              value={formData.tripDays}
              onChange={(e) => update("tripDays", Number(e.target.value))}
              placeholder="Enter number of days"
              className="w-32"
            />
          </div>
        )}

      </div>

      {/* Step 3 */}
      <div className={step === 3 ? "mt-4" : "hidden"}>
        <div className="flex gap-10">
          <div className="inline-flex items-center py-3">
            <label className="relative flex items-center cursor-pointer">
              <input
                name="hotel"
                type="radio"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-slate-400 transition-all"
                checked={formData.hotelBooked === true}
                onChange={() => update("hotelBooked", true)}
              />
              <span className="absolute bg-slate-800 w-3 h-3 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </label>
            <label
              className="ml-2 text-slate-600 cursor-pointer text-sm"
              onClick={() => update("hotelBooked", true)}
            >
              Yes
            </label>
          </div>

          <div className="inline-flex items-center py-3">
            <label className="relative flex items-center cursor-pointer">
              <input
                name="hotel"
                type="radio"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-slate-400 transition-all"
                checked={formData.hotelBooked === false}
                onChange={() =>
                  setFormData((p) => ({ ...p, hotelBooked: false, hotelName: "" }))
                }
              />
              <span className="absolute bg-slate-800 w-3 h-3 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </label>
            <label
              className="ml-2 text-slate-600 cursor-pointer text-sm"
              onClick={() =>
                setFormData((p) => ({ ...p, hotelBooked: false, hotelName: "" }))
              }
            >
              No
            </label>
          </div>
        </div>

        {formData.hotelBooked && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Hotel Name
            </label>
            <AutoComplete
              value={formData.hotelName}
              options={hotelSuggestions.map((s) => ({ value: s }))}
              onSearch={(text) => update("hotelName", text)}
              onSelect={(value) => {
                update("hotelName", value);
                setHotelSuggestions([]);
              }}
              filterOption={false}
              className="w-full"
            >
              <Input id="hotelName" placeholder="Type to load suggestions..." />
            </AutoComplete>

            <label className="block text-sm font-medium text-gray-900 mt-2 mb-1">
              Hotel reservation dates
            </label>
            <RangePicker
              value={formData.hotelDateRange}
              onChange={(dates, dateStrings) => {
                update("hotelDateRange", dates as any);
                const ds = dateStrings as string[];
                update(
                  "hotelDateStrings",
                  ds?.[0] && ds?.[1] ? ([ds[0], ds[1]] as [string, string]) : null
                );
              }}
              className="w-full"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />

          </div>
        )}
      </div>


      {/* Step 4 */}
      <div className={step === 4 ? "mt-4" : "hidden"}>
        <div className="flex flex-wrap gap-2">
          {VIBE_TAGS.map((tag) => (
            <Tag.CheckableTag
              key={tag}
              checked={formData.vibeTags.includes(tag)}
              onChange={(checked) => toggleVibeTag(tag, checked)}
            >
              {tag}
            </Tag.CheckableTag>
          ))}
        </div>

        {isOthersSelected ? (
          <div className="mt-3">
            <Input
              value={formData.vibeOther}
              onChange={(e) => update("vibeOther", e.target.value)}
              placeholder="Give keywords only"
            />
          </div>
        ) : null}
      </div>

      {/* Step 5 */}
      <div className={step === 5 ? "mt-4" : "hidden"}>
        <TextArea
          rows={4}
          value={formData.mustDo}
          onChange={(e) => update("mustDo", e.target.value)}
          placeholder="List your must-do places/activities..."
        />
      </div>

      {/* Step 6 */}
      <div className={step === 6 ? "mt-4" : "hidden"}>
        <div className="flex flex-wrap gap-2">
          {BUDGET_TAGS.map((b) => (
            <Tag.CheckableTag
              key={b}
              checked={formData.budget === b}
              onChange={(checked) => update("budget", checked ? b : "> 500 USD")}
            >
              {b}
            </Tag.CheckableTag>
          ))}
        </div>
      </div>

      {/* Step 7 */}
      <div className={step === 7 ? "mt-4" : "hidden"}>
        <Input
          value={formData.dietary}
          onChange={(e) => update("dietary", e.target.value)}
          placeholder="Ex: nuts, vegan, halal"
        />
      </div>

      {/* Step 8 */}
      <div className={step === 8 ? "mt-4" : "hidden"}>
        <Radio.Group
          onChange={transportOnChange}
          value={formData.transport || undefined}
          options={[
            { value: "Public Transport", label: "Public Transport" },
            { value: "Driving", label: "Driving" },
            { value: "No", label: "No" },
          ]}
        />
      </div>

      {/* Step 9 */}
      <div className={step === 9 ? "mt-4" : "hidden"}>
        
        <div className="gap-3 text-gray-700 flex flex-col">
          <div>
            <span className="font-semibold">Country / City:</span> {formData.country}, {formData.city}
          </div>
          <div>
            <span className="font-semibold">Flights booked:</span> {formData.flightsBooked ? "Yes" : "No"}
          </div>
          {formData.flightsBooked && (
            <>
              <div>
                <span className="font-semibold">Arrival:</span> {formData.arrivalTime ? new Date(formData.arrivalTime).toLocaleString() : "-"}
              </div>
              <div>
                <span className="font-semibold">Departure:</span> {formData.departureTime ? new Date(formData.departureTime).toLocaleString() : "-"}
              </div>
            </>
          )}
          {!formData.flightsBooked && (
            <div>
              <span className="font-semibold">Trip Duration:</span> {formData.tripDays} {formData.tripDays === 1 ? "day" : "days"}
            </div>
          )}
          <div>
            <span className="font-semibold">Hotel booked:</span> {formData.hotelBooked ? formData.hotelName || "Yes" : "No"}
          </div>
          {formData.hotelBooked && formData.hotelDateStrings && (
            <div>
              <span className="font-semibold">Hotel Dates:</span> {formData.hotelDateStrings[0]} → {formData.hotelDateStrings[1]}
            </div>
          )}
          <div>
            <span className="font-semibold">Trip Vibe:</span> {formData.vibeTags.join(", ")} {formData.vibeOther ? `(${formData.vibeOther})` : ""}
          </div>
          <div>
            <span className="font-semibold">Must-Do List:</span> {formData.mustDo || "-"}
          </div>
          <div>
            <span className="font-semibold">Budget:</span> {formData.budget || "-"}
          </div>
          <div>
            <span className="font-semibold">Dietary:</span> {formData.dietary || "-"}
          </div>
          <div>
            <span className="font-semibold">Transport:</span> {formData.transport || "-"}
          </div>
      </div>

      {status === "submitting" && (
        <div className="mt-6 flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p
            className={`text-blue-600 font-medium text-center transition-opacity duration-500 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            {loadingMessages[currentMessage]}
          </p>
        </div>
      )}

      {status === "error" && error && (
        <div className="mt-4 text-red-600 font-medium text-center">
          ⚠️ {error}
        </div>
      )}
    </div>


      <div className="mt-6 flex justify-end gap-3">
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-inter cursor-pointer hover:bg-blue-700 transition-all duration-300"
            onClick={goNext}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className={`bg-blue-500 text-white px-6 py-2 rounded-lg font-inter cursor-pointer transition-all duration-300 ${
              status === "submitting"
                ? "opacity-50 cursor-not-allowed hover:bg-blue-500"
                : "hover:bg-blue-700"
            }`}
            onClick={onFinish}
            disabled={status === "submitting"} // disable if submitting
          >
            {status === "submitting" ? "Creating itinerary..." : "Create Itinerary"}
          </button>
        )}
      </div>
    </div>
  );
}
