"use client";
import { useEffect, useState } from "react";
import { Table, Button, Tag } from "antd";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";
import type { ColumnsType } from "antd/es/table";

export default function ItineraryPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<any>(null);
  const [flattenedSchedule, setFlattenedSchedule] = useState<any[]>([]);
  const [mergedRows, setMergedRows] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const raw = sessionStorage.getItem("generatedItinerary");
    if (!raw) return;
    const data = JSON.parse(raw);
    setItinerary(data);

    const flat = data.days.flatMap((day: any) =>
      day.schedule.map((item: any) => ({
        dateLabel: day.dateLabel,
        time: item.time,
        type: item.type,
        title: item.title,
        locationName: `${item.location.name} (${item.location.area})`,
        notes: [
          item.mealType ? `Meal: ${item.mealType}` : "",
          item.restaurant
            ? `${item.restaurant.cuisine} • ${item.restaurant.dietaryConfidence}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      }))
    );

    setFlattenedSchedule(flat);

    // Compute rowSpans for date merging
    const spans: { [key: number]: number } = {};
    let i = 0;
    while (i < flat.length) {
      const date = flat[i].dateLabel;
      let count = 1;
      for (let j = i + 1; j < flat.length; j++) {
        if (flat[j].dateLabel === date) count++;
        else break;
      }
      spans[i] = count; // first row gets count
      for (let k = i + 1; k < i + count; k++) spans[k] = 0; // others 0
      i += count;
    }
    setMergedRows(spans);
    }, []);

    const typeTagColors: Record<string, string> = {
        activity: "geekblue",
        meal: "green",
        transport: "purple",
        hotel: "volcano",
    };

    const columns: ColumnsType<any> = [
			{
					title: "Date",
					dataIndex: "dateLabel",
					key: "dateLabel",
					width: 100,
					onCell: (_record, rowIndex?) => ({
					rowSpan: rowIndex !== undefined ? mergedRows[rowIndex] : 1,
					}),
			},
			{ title: "Time", dataIndex: "time", key: "time", width: 90 },
			{
					title: "Type",
					dataIndex: "type",
					key: "type",
					width: 100,
					render: (type: string) => {
					const color = typeTagColors[type.toLowerCase()] || "default";
					return <Tag color={color}>{type.toUpperCase()}</Tag>;
					},
			},
			{ title: "Title", dataIndex: "title", key: "title" },
			{ title: "Location", dataIndex: "locationName", key: "locationName" },
			{ title: "Notes", dataIndex: "notes", key: "notes" },
    ];

  const exportAllToPDF = () => {
    if (!itinerary) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(itinerary.itineraryTitle, 14, 15);

    const body = flattenedSchedule.map((item) => [
      item.dateLabel,
      item.time,
      item.type,
      item.title,
      item.locationName,
      item.notes,
    ]);

    autoTable(doc, {
      startY: 22,
      head: [["Date", "Time", "Type", "Title", "Location", "Notes"]],
      body,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0 },
    });

    doc.save(`${itinerary.itineraryTitle.replace(/\s+/g, "-")}.pdf`);
  };

  const handleNewItinerary = () => {
    if (confirm("Are you sure you want to create a new itinerary?")) {
      sessionStorage.removeItem("generatedItinerary");
      router.push("/"); // redirect to your form page
    }
  };

  if (!itinerary)
    return (
      <div className="p-6">
        No itinerary found.
        <div className="mt-4">
          <Button type="primary" onClick={() => router.push("/")}>
            Create New Itinerary
          </Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl p-6">
    <div className="flex flex-row justify-between">
        <h1 className="text-2xl font-semibold mb-4">{itinerary.itineraryTitle}</h1>
      <Button type="primary" className="mb-4" onClick={exportAllToPDF}>
        Export Full PDF
      </Button>
    </div>
      

      <Table
        columns={columns}
        dataSource={flattenedSchedule.map((item, i) => ({ ...item, key: i }))}
        pagination={false}
        size="small"
        bordered
      />

      {itinerary.notes.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-md mt-6">
          <h4 className="font-medium mb-2">Notes</h4>
          <ul className="list-disc ml-5 text-sm">
            {itinerary.notes.map((note: string, i: number) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    
    <Button className="mt-8" type="primary" onClick={handleNewItinerary}>
        Create New Itinerary
    </Button>
    </div>
  );
}
