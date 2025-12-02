"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { load, save } from "@/app/lib/storage";
import { generateId } from "@/app/lib/uid";

type AppointmentInfo = {
  id: string;
  doctorId: string;
  slotId?: string;
  start: string;
  end: string;
  tokenNumber: string;
  createdAt: string;
};

type Patient = {
  id: string;
  name: string;
  age: number;
  doctorId: string | null;
  createdAt: string;
  appointments?: AppointmentInfo[] | null;
};

type Doctor = {
  id: string;
  name: string;
  type?: string;
};

const STORAGE_KEY = "patient_registration_patients";

export default function NewPatientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string>("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load doctors for dropdown
  useEffect(() => {
    const docs = load("doctors", []) as Doctor[];
    setDoctors(docs);
    if (docs.length && !doctorId) {
      setDoctorId(docs[0].id);
    }
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const parsedAge = Number(age);

    if (!trimmedName) {
      setError("Please enter the patient's name.");
      return;
    }

    if (!age || Number.isNaN(parsedAge) || parsedAge <= 0) {
      setError("Please enter a valid age.");
      return;
    }

    const patients = load(STORAGE_KEY, []) as Patient[];

    const newPatient: Patient = {
      id: generateId("pat_"),
      name: trimmedName,
      age: parsedAge,
      doctorId: doctorId || null,
      createdAt: new Date().toISOString(),
      appointments: null,
    };

    patients.push(newPatient);
    save(STORAGE_KEY, patients);

    // broadcast so list pages can reload if they listen
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("patients-updated", {
          detail: { patientId: newPatient.id },
        })
      );
    }

    router.push("/admin/dashboard/patient-registration");
  }

  return (
    <div className="space-y-4">
      {/* Header row matching doctor create page style */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Add Patient</h3>
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard/patient-registration")}
          className="px-3 py-1 border rounded text-sm"
        >
          Cancel
        </button>
      </div>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded border space-y-3 max-w-xl"
      >
        <div>
          <label
            htmlFor="patient-name"
            className="block text-sm text-slate-600"
          >
            Patient Name
          </label>
          <input
            id="patient-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label htmlFor="patient-age" className="block text-sm text-slate-600">
            Age
          </label>
          <input
            id="patient-age"
            type="number"
            min={0}
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age in years"
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label
            htmlFor="patient-doctor"
            className="block text-sm text-slate-600"
          >
            Primary Doctor
          </label>
          {doctors.length ? (
            <select
              id="patient-doctor"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.type ? `• ${d.type}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-slate-500">
              No doctors found. Create a doctor first from{" "}
              <span className="font-medium">Users &gt; Doctors</span>.
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-3 py-1 bg-indigo-600 text-white rounded"
          >
            Save patient
          </button>
          <p className="text-xs text-slate-500">
            Data is stored locally in this browser (localStorage).
          </p>
        </div>
      </form>
    </div>
  );
}
