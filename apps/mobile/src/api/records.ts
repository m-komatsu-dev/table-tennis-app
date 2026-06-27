import { fetchMatchRecords } from "@/api/match";
import { fetchPracticeLogs } from "@/api/practice";

export async function fetchMobileRecords() {
  const [practiceResult, matchResult] = await Promise.all([
    fetchPracticeLogs(),
    fetchMatchRecords()
  ]);

  return {
    practiceLogs: practiceResult.practiceLogs,
    matchRecords: matchResult.matchRecords
  };
}
