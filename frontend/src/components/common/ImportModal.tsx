import React, { useState, useRef } from "react";
import { Download, Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultClientType?: "WEDDING" | "FASHION";
  onImport: (rows: any[]) => Promise<any>;
}

export default function ImportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultClientType = "WEDDING",
  onImport,
}: ImportModalProps) {
  const [fileName, setFileName] = useState<string>("");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Sample CSV
  const handleDownloadSample = () => {
    const headers = [
      "Full Name",
      "Phone",
      "Email",
      "City",
      "Client Type",
      "Source",
      "Company Name",
      "Address",
      "Notes",
    ];
    const sampleRows = [
      [
        "Rohan Sharma",
        "9876543210",
        "rohan@example.com",
        "Mumbai",
        "WEDDING",
        "Instagram",
        "",
        "Bandra West",
        "Wedding photography enquiry",
      ],
      [
        "Vogue Apparel",
        "9123456789",
        "contact@vogueapparel.in",
        "Delhi",
        "FASHION",
        "Direct",
        "Vogue Studio",
        "Connaught Place",
        "Autumn Lookbook Shoot",
      ],
      [
        "Priya & Kabir",
        "9898989898",
        "priya.k@gmail.com",
        "Bengaluru",
        "WEDDING",
        "Referral",
        "",
        "Indiranagar",
        "3-day destination wedding",
      ],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...sampleRows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pfs_clients_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV Parser
  const parseCSV = (text: string) => {
    const lines: string[] = [];
    let currentLine = "";
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '\"' && insideQuote && nextChar === '\"') {
        currentLine += '\"';
        i++;
      } else if (char === '\"') {
        insideQuote = !insideQuote;
      } else if ((char === "\r" && nextChar === "\n") || char === "\n") {
        if (insideQuote) {
          currentLine += "\n";
        } else {
          lines.push(currentLine);
          currentLine = "";
          if (char === "\r") i++;
        }
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) lines.push(currentLine);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const cells: string[] = [];
      let cell = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        const next = line[i + 1];
        if (c === '\"' && inQ && next === '\"') {
          cell += '\"';
          i++;
        } else if (c === '\"') {
          inQ = !inQ;
        } else if (c === "," && !inQ) {
          cells.push(cell.trim());
          cell = "";
        } else {
          cell += c;
        }
      }
      cells.push(cell.trim());
      return cells;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = parseLine(line);
      const raw: Record<string, string> = {};
      headers.forEach((h, idx) => {
        raw[h] = values[idx] || "";
      });

      const fullName =
        raw["fullname"] ||
        raw["name"] ||
        raw["clientname"] ||
        raw["contactname"] ||
        raw["customername"] ||
        "";
      const phone =
        raw["phone"] ||
        raw["phonenumber"] ||
        raw["mobile"] ||
        raw["mobilenumber"] ||
        raw["contact"] ||
        "";
      const email = raw["email"] || raw["emailaddress"] || "";
      const city = raw["city"] || raw["location"] || "";
      const rawType = (raw["clienttype"] || raw["type"] || raw["domain"] || "").toUpperCase();
      const clientType = rawType.includes("FASHION")
        ? "FASHION"
        : rawType.includes("WEDD")
        ? "WEDDING"
        : defaultClientType;
      const source = raw["source"] || "Import";
      const companyName = raw["companyname"] || raw["company"] || raw["brand"] || "";
      const address = raw["address"] || "";
      const notes = raw["notes"] || raw["note"] || raw["remark"] || "";

      const isValid = Boolean(fullName && phone);

      rows.push({
        fullName,
        phone,
        email: email || undefined,
        city: city || undefined,
        clientType,
        source,
        companyName: companyName || undefined,
        address: address || undefined,
        notes: notes || undefined,
        isValid,
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid .csv file");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          toast.error("No data found in the CSV file");
        } else {
          setParsedData(parsed);
          toast.success(`Found ${parsed.length} records in ${file.name}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.length - validCount;

  const handleConfirmImport = async () => {
    const validRows = parsedData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import. Name and Phone are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await onImport(validRows);
      toast.success(res.data?.message || `Successfully imported ${validRows.length} clients!`);
      handleReset();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to import records");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFileName("");
    setParsedData([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Clients via CSV" size="xl">
      <div className="space-y-5">
        {/* Template helper banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-sm text-amber-900">
          <div>
            <span className="font-semibold block text-amber-950">Need a pre-formatted template?</span>
            <p className="text-xs text-amber-800/80 mt-0.5">
              Download our sample spreadsheet with standard column headers (Name, Phone, Email, City, etc.).
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-amber-100/60 text-amber-900 font-medium text-xs rounded-lg border border-amber-300 shadow-sm transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C59B27]" />
            Download Sample CSV
          </button>
        </div>

        {/* Upload Drop Zone */}
        {parsedData.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-[#C59B27] bg-gray-50/50 hover:bg-amber-50/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-amber-100/60 group-hover:bg-[#C59B27]/20 flex items-center justify-center text-[#C59B27] mb-3 transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              Click to select or drag & drop a .csv file
            </p>
            <p className="text-xs text-gray-400 mt-1">Supports standard CSV spreadsheets up to 10MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info Bar */}
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C59B27]" />
                <span className="font-medium text-gray-800 truncate max-w-[200px] sm:max-w-xs">
                  {fileName}
                </span>
                <span className="text-xs text-gray-400">({parsedData.length} total)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-medium border border-emerald-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {validCount} ready
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded-md font-medium border border-rose-200/60">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {invalidCount} missing name/phone
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-gray-800 underline ml-2 cursor-pointer"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Data Preview (First 5 records)
                </span>
                <span className="text-xs text-gray-400">Showing up to 5 of {parsedData.length}</span>
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Phone</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">City</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className={row.isValid ? "hover:bg-gray-50/50" : "bg-rose-50/30"}>
                        <td className="px-3 py-2.5 font-medium text-gray-900">
                          {row.fullName || <span className="text-rose-500 italic">Missing</span>}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">
                          {row.phone || <span className="text-rose-500 italic">Missing</span>}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">{row.email || "—"}</td>
                        <td className="px-3 py-2.5 text-gray-500">{row.city || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              row.clientType === "FASHION"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {row.clientType}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {row.isValid ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center gap-1 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" /> Incomplete
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={loading || validCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C59B27] hover:bg-[#b58c1e] disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm shadow-[#C59B27]/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import {validCount > 0 ? `${validCount} Clients` : "Clients"}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
