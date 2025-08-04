// src/pages/admin/ParticipationReport.tsx
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase"; // Ensure the correct path to the firebase module

const ParticipationReport: React.FC = () => {
  const [report, setReport] = useState<any[]>([]);

  useEffect(() => {
    const loadReport = async () => {
      const eventsSnap = await getDocs(collection(db, "events"));
      const data = await Promise.all(
        eventsSnap.docs.map(async (evDoc) => {
          const participationSnap = await getDocs(
            collection(db, `events/${evDoc.id}/participation`)
          );
          const counts = { confirmed: 0, maybe: 0, declined: 0 };
          participationSnap.docs.forEach(docSnap => {
            const status: 'confirmed' | 'maybe' | 'declined' = docSnap.data().status; // Specify the type for status
            counts[status] = (counts[status] || 0) + 1;
          });
          return {
            event: evDoc.data().title,
            ...counts
          };
        })
      );
      setReport(data);
    };
    loadReport();
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Event</th>
          <th>Confirmed</th>
          <th>Maybe</th>
          <th>Declined</th>
        </tr>
      </thead>
      <tbody>
        {report.map((r, idx) => (
          <tr key={idx}>
            <td>{r.event}</td>
            <td>{r.confirmed}</td>
            <td>{r.maybe}</td>
            <td>{r.declined}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
export default ParticipationReport;
