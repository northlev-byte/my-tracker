import { createClient } from "@supabase/supabase-js";

// Anon key is safe to expose client-side — security enforced by RLS policies
export const supabase = createClient(
  "https://dustykmbxlbcfyvnrlnb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c3R5a21ieGxiY2Z5dm5ybG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwOTc3MzYsImV4cCI6MjEwMTY3MzczNn0.-qVh6P4tuZbJop_TJmmejJmOAlZc0pY-54kCX2ZRUtk"
);

// Map JS camelCase fields → Postgres snake_case
export function mapToDb(lead) {
  return {
    id:             lead.id,
    client:         lead.client         ?? "",
    event:          lead.event          ?? "",
    ref:            lead.ref            ?? "",
    date:           lead.date           ?? "",
    end_date:       lead.endDate        ?? "",
    venue:          lead.venue          ?? "",
    assignee:       lead.assignee       ?? "",
    stage:          lead.stage          ?? "New Enquiry",
    name:           lead.name           ?? "",
    company:        lead.company        ?? "",
    email:          lead.email          ?? "",
    value:          lead.value          ?? "",
    notes:          lead.notes          ?? "",
    class_code:     lead.classCode      ?? "",
    files:          lead.files          ?? [],
    recontact_date: lead.recontactDate  ?? "",
  };
}

// Map Postgres snake_case → JS camelCase
export function mapFromDb(row) {
  return {
    id:            row.id,
    client:        row.client        ?? "",
    event:         row.event         ?? "",
    ref:           row.ref           ?? "",
    date:          row.date          ?? "",
    endDate:       row.end_date      ?? "",
    venue:         row.venue         ?? "",
    assignee:      row.assignee      ?? "",
    stage:         row.stage         ?? "New Enquiry",
    name:          row.name          ?? "",
    company:       row.company       ?? "",
    email:         row.email         ?? "",
    value:         row.value         ?? "",
    notes:         row.notes         ?? "",
    classCode:     row.class_code    ?? "",
    files:         row.files         ?? [],
    recontactDate: row.recontact_date ?? "",
  };
}
